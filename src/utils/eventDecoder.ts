import eventsDatabase from "../config/events.json";

// Type for the events database
interface EventInfo {
  event: string;
  type: string;
  description: string;
}

interface EventsDatabase {
  [signature: string]: EventInfo;
}

// Parsed parameter from event signature
interface EventParam {
  type: string;
  indexed: boolean;
}

// Decoded event result
export interface DecodedEvent {
  name: string;
  signature: string;
  fullSignature: string;
  type: string;
  description: string;
  params: DecodedParam[];
}

export interface DecodedParam {
  name: string;
  type: string;
  value: string;
  indexed: boolean;
}

const events = eventsDatabase as EventsDatabase;

/**
 * Parse event signature to extract parameter types
 * e.g., "Transfer(address,address,uint256)" -> [{type: "address"}, {type: "address"}, {type: "uint256"}]
 */
function parseEventSignature(signature: string): {
  name: string;
  params: EventParam[];
} {
  const match = signature.match(/^(\w+)\((.*)\)$/);
  if (!match) {
    return { name: signature, params: [] };
  }

  const name = match[1] || signature;
  const paramsStr = match[2] || "";

  if (!paramsStr) {
    return { name, params: [] };
  }

  // Handle nested types like (address,uint256)[]
  const params: EventParam[] = [];
  let depth = 0;
  let current = "";

  for (const char of paramsStr) {
    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      if (current) {
        params.push({ type: current.trim(), indexed: false });
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current) {
    params.push({ type: current.trim(), indexed: false });
  }

  return { name, params };
}

/**
 * Decode a uint256 value from hex
 */
function decodeUint256(hex: string): string {
  if (!hex || hex === "0x") return "0";
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  // Use BigInt for large numbers
  try {
    const value = BigInt(`0x${cleaned}`);
    return value.toString();
  } catch {
    return hex;
  }
}

/**
 * Decode an address from a 32-byte topic (last 20 bytes)
 */
function decodeAddress(hex: string): string {
  if (!hex) return "";
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  // Address is last 40 characters (20 bytes)
  const address = cleaned.slice(-40);
  return `0x${address}`;
}

/**
 * Decode int256 value from hex (handles negative numbers)
 */
function decodeInt256(hex: string): string {
  if (!hex || hex === "0x") return "0";
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  try {
    const value = BigInt(`0x${cleaned}`);
    // Check if negative (highest bit set)
    const maxPositive = BigInt(
      "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    );
    if (value > maxPositive) {
      // Two's complement for negative numbers
      const maxUint = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      return (-(maxUint - value + BigInt(1))).toString();
    }
    return value.toString();
  } catch {
    return hex;
  }
}

/**
 * Decode a bytes32 value
 */
function decodeBytes32(hex: string): string {
  return hex; // Return as-is for bytes32
}

/**
 * Decode a bool value
 */
function decodeBool(hex: string): string {
  const value = decodeUint256(hex);
  return value === "1" ? "true" : "false";
}

/**
 * Decode a single value based on its type
 */
function decodeValue(hex: string, type: string): string {
  if (!hex) return "";

  const baseType = type.replace(/\[\]$/, ""); // Remove array suffix

  if (baseType === "address") {
    return decodeAddress(hex);
  }
  if (baseType.startsWith("uint")) {
    return decodeUint256(hex);
  }
  if (baseType.startsWith("int")) {
    return decodeInt256(hex);
  }
  if (baseType === "bool") {
    return decodeBool(hex);
  }
  if (baseType === "bytes32") {
    return decodeBytes32(hex);
  }
  // For other types, return hex as-is
  return hex;
}

/**
 * Decode event data (non-indexed parameters)
 * Data is packed in 32-byte chunks
 */
function decodeEventData(data: string, params: EventParam[]): string[] {
  if (!data || data === "0x") return [];

  const cleaned = data.startsWith("0x") ? data.slice(2) : data;
  const values: string[] = [];

  // Each parameter is 32 bytes (64 hex chars)
  const chunkSize = 64;
  let offset = 0;

  for (const param of params) {
    if (offset >= cleaned.length) break;

    const chunk = `0x${cleaned.slice(offset, offset + chunkSize)}`;
    values.push(decodeValue(chunk, param.type));
    offset += chunkSize;
  }

  return values;
}

/**
 * Look up event by topic0 signature
 */
export function lookupEvent(topic0: string): EventInfo | null {
  const normalizedTopic = topic0.toLowerCase();

  for (const [sig, info] of Object.entries(events)) {
    if (sig.toLowerCase() === normalizedTopic) {
      return info;
    }
  }

  return null;
}

/**
 * Decode an event log
 */
export function decodeEventLog(topics: string[], data: string): DecodedEvent | null {
  if (!topics || topics.length === 0) return null;

  const topic0 = topics[0];
  if (!topic0) return null;

  const eventInfo = lookupEvent(topic0);

  if (!eventInfo) return null;

  const { name, params } = parseEventSignature(eventInfo.event);

  // For standard events, indexed params are in topics[1..], non-indexed in data
  // Determine which params are indexed based on topics count
  const indexedCount = topics.length - 1; // Exclude topic0

  const decodedParams: DecodedParam[] = [];
  let topicIndex = 1;

  // First pass: collect indexed params from topics
  for (let i = 0; i < params.length && topicIndex < topics.length; i++) {
    const param = params[i];
    if (!param) continue;

    const topicValue = topics[topicIndex];
    // Common indexed types: address, uint256, bytes32
    // For Transfer/Approval: first two addresses are indexed
    if (topicIndex <= indexedCount && topicValue) {
      decodedParams.push({
        name: getParamName(name, i),
        type: param.type,
        value: decodeValue(topicValue, param.type),
        indexed: true,
      });
      topicIndex++;
    }
  }

  // Remaining params are from data
  const remainingParams = params.slice(decodedParams.length);
  const dataValues = decodeEventData(data, remainingParams);

  for (let i = 0; i < remainingParams.length; i++) {
    const param = remainingParams[i];
    if (!param) continue;

    decodedParams.push({
      name: getParamName(name, decodedParams.length),
      type: param.type,
      value: dataValues[i] || "",
      indexed: false,
    });
  }

  return {
    name,
    signature: topic0,
    fullSignature: eventInfo.event,
    type: eventInfo.type,
    description: eventInfo.description,
    params: decodedParams,
  };
}

/**
 * Get a human-readable parameter name based on event type
 */
function getParamName(eventName: string, index: number): string {
  // Common parameter names for known events
  const paramNames: Record<string, string[]> = {
    Transfer: ["from", "to", "value"],
    Approval: ["owner", "spender", "value"],
    ApprovalForAll: ["owner", "operator", "approved"],
    Swap: ["sender", "amount0In", "amount1In", "amount0Out", "amount1Out", "to"],
    Mint: ["sender", "amount0", "amount1"],
    Burn: ["sender", "amount0", "amount1", "to"],
    Sync: ["reserve0", "reserve1"],
    Deposit: ["sender", "owner", "assets", "shares"],
    Withdraw: ["sender", "receiver", "owner", "assets", "shares"],
    Borrow: ["reserve", "user", "amount", "borrowRateMode"],
    Repay: ["reserve", "user", "repayer", "amount"],
    OwnershipTransferred: ["previousOwner", "newOwner"],
    RoleGranted: ["role", "account", "sender"],
    RoleRevoked: ["role", "account", "sender"],
  };

  const names = paramNames[eventName];
  if (names && index < names.length) {
    return names[index] || `param${index}`;
  }

  return `param${index}`;
}

/**
 * Format a decoded value for display
 */
export function formatDecodedValue(value: string, type: string): string {
  if (!value) return "";

  // Format large numbers with commas
  if (type.startsWith("uint") || type.startsWith("int")) {
    try {
      const num = BigInt(value);
      // If it looks like a token amount (> 1e15), format as potential token value
      if (num > BigInt(1e15)) {
        // Show both raw and potential ETH value
        const ethValue = Number(num) / 1e18;
        if (ethValue >= 0.0001 && ethValue < 1e15) {
          return `${num.toLocaleString()} (≈${ethValue.toFixed(6)} if 18 decimals)`;
        }
      }
      return num.toLocaleString();
    } catch {
      return value;
    }
  }

  return value;
}

/**
 * Get a badge color based on event type
 */
export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    erc: "#10b981", // green - token events
    dex_v2: "#8b5cf6", // purple - DEX v2
    dex_v3: "#a855f7", // lighter purple - DEX v3
    vault: "#f59e0b", // amber - vaults
    lending: "#3b82f6", // blue - lending
    l2_bridge: "#ec4899", // pink - L2 bridges
    nft_market: "#14b8a6", // teal - NFT
    admin: "#6b7280", // gray - admin
  };

  return colors[type] || "#6b7280";
}
