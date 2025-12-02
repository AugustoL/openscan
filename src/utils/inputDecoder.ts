import { decodeFunctionData, toFunctionSelector } from "viem";
import type { DecodedParam } from "./eventDecoder";

// Decoded function call result
export interface DecodedInput {
  functionName: string;
  signature: string; // e.g., "transfer(address,uint256)"
  params: DecodedParam[];
}

// ABI function item type
interface AbiFunction {
  type: "function";
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed?: boolean;
    components?: Array<{ name: string; type: string }>;
  }>;
  outputs?: Array<{ name: string; type: string }>;
  stateMutability?: string;
}

/**
 * Build a function signature from an ABI function item
 */
function buildSignature(abiItem: AbiFunction): string {
  const inputs = abiItem.inputs || [];
  const paramTypes = inputs.map((input) => input.type);
  return `${abiItem.name}(${paramTypes.join(",")})`;
}

/**
 * Format a decoded value for display
 */
function formatValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return `[${value.map((v) => formatValue(v)).join(", ")}]`;
  }

  if (typeof value === "object") {
    // Handle struct-like objects
    const entries = Object.entries(value as Record<string, unknown>);
    return `{${entries.map(([k, v]) => `${k}: ${formatValue(v)}`).join(", ")}}`;
  }

  return String(value);
}

/**
 * Decode a function call from calldata using an ABI
 * @param data - The calldata (input) hex string
 * @param abi - The contract ABI array
 * @returns DecodedInput or null if decoding fails
 */
// biome-ignore lint/suspicious/noExplicitAny: ABI types are dynamic
export function decodeFunctionCall(data: string, abi: any[]): DecodedInput | null {
  // Validate input
  if (!data || data === "0x" || data.length < 10) {
    return null;
  }

  if (!abi || !Array.isArray(abi) || abi.length === 0) {
    return null;
  }

  // Extract function selector (first 4 bytes)
  const selector = data.slice(0, 10).toLowerCase();

  // Find matching function in ABI by selector
  // biome-ignore lint/suspicious/noExplicitAny: ABI types are dynamic
  const functionItems = abi.filter((item: any) => item.type === "function") as AbiFunction[];

  let matchedFunction: AbiFunction | null = null;

  for (const fn of functionItems) {
    try {
      const signature = buildSignature(fn);
      const computedSelector = toFunctionSelector(signature).toLowerCase();
      if (computedSelector === selector) {
        matchedFunction = fn;
        break;
      }
    } catch {}
  }

  if (!matchedFunction) {
    return null;
  }

  // Build the function signature
  const signature = buildSignature(matchedFunction);

  // Try to decode using viem's decodeFunctionData
  try {
    const decoded = decodeFunctionData({
      abi: [matchedFunction],
      data: data as `0x${string}`,
    });

    // Map decoded args to DecodedParam array
    const params: DecodedParam[] = [];
    const inputs = matchedFunction.inputs || [];
    const args = decoded.args || [];

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (!input) continue;

      const value = args[i];
      params.push({
        name: input.name || `param${i}`,
        type: input.type,
        value: formatValue(value),
        indexed: false, // Function params are not indexed (that's for events)
      });
    }

    return {
      functionName: matchedFunction.name,
      signature,
      params,
    };
  } catch {
    // If decoding fails, return basic info without params
    return {
      functionName: matchedFunction.name,
      signature,
      params: [],
    };
  }
}

/**
 * Decode an event log using a contract ABI
 * @param topics - Event topics array
 * @param data - Event data hex string
 * @param abi - The contract ABI array
 * @returns DecodedInput-like object for the event or null
 */
export function decodeEventWithAbi(
  topics: string[],
  data: string,
  // biome-ignore lint/suspicious/noExplicitAny: ABI types are dynamic
  abi: any[],
): DecodedInput | null {
  if (!topics || topics.length === 0 || !abi || !Array.isArray(abi)) {
    return null;
  }

  const topic0 = topics[0];
  if (!topic0) return null;

  // Find matching event in ABI
  // biome-ignore lint/suspicious/noExplicitAny: ABI types are dynamic
  const eventItems = abi.filter((item: any) => item.type === "event");

  // biome-ignore lint/suspicious/noExplicitAny: ABI types are dynamic
  let matchedEvent: any = null;

  for (const evt of eventItems) {
    try {
      const inputs = evt.inputs || [];
      const paramTypes = inputs.map((i: { type: string }) => i.type);
      const signature = `${evt.name}(${paramTypes.join(",")})`;
      // Event topic0 is keccak256 of signature - we can use the same approach
      const { keccak256, toBytes } = require("viem");
      const computedTopic = keccak256(toBytes(signature)).toLowerCase();
      if (computedTopic === topic0.toLowerCase()) {
        matchedEvent = evt;
        break;
      }
    } catch {}
  }

  if (!matchedEvent) {
    return null;
  }

  // Build signature
  const inputs = matchedEvent.inputs || [];
  const signature = `${matchedEvent.name}(${inputs.map((i: { type: string }) => i.type).join(",")})`;

  // Decode event parameters
  try {
    const { decodeEventLog } = require("viem");
    const decoded = decodeEventLog({
      abi: [matchedEvent],
      data: data as `0x${string}`,
      topics: topics as [`0x${string}`, ...`0x${string}`[]],
    });

    const params: DecodedParam[] = [];
    const args = decoded.args || {};

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (!input) continue;

      // decodeEventLog returns args as an object keyed by param name
      const value = args[input.name] ?? args[i];
      params.push({
        name: input.name || `param${i}`,
        type: input.type,
        value: formatValue(value),
        indexed: input.indexed || false,
      });
    }

    return {
      functionName: matchedEvent.name,
      signature,
      params,
    };
  } catch {
    return {
      functionName: matchedEvent.name,
      signature,
      params: [],
    };
  }
}
