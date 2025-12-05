/**
 * ERC1155 Token Metadata Utilities
 * Handles fetching and parsing ERC1155 token metadata from various URI formats
 */

import { decodeAbiString, hexToString } from "./hexUtils";

export interface ERC1155TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type?: string;
    value?: string | number;
    display_type?: string;
  }>;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  if (uri.startsWith("ipfs/")) {
    return `https://ipfs.io/${uri}`;
  }
  return uri;
}

/**
 * Substitute {id} placeholder in URI with hex-padded token ID
 * Per ERC1155 spec: 64 hex chars, lowercase, no 0x prefix
 */
export function substituteTokenId(uri: string, tokenId: string): string {
  // Convert tokenId to BigInt, then to hex, pad to 64 chars
  const tokenIdBigInt = BigInt(tokenId);
  const hexId = tokenIdBigInt.toString(16).toLowerCase().padStart(64, "0");
  return uri.replace("{id}", hexId);
}

/**
 * Parse data URI (base64 encoded JSON)
 */
function parseDataUri(uri: string): ERC1155TokenMetadata | null {
  try {
    // Handle data:application/json;base64,...
    if (uri.startsWith("data:application/json;base64,")) {
      const base64Data = uri.slice("data:application/json;base64,".length);
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    }
    // Handle data:application/json,...
    if (uri.startsWith("data:application/json,")) {
      const jsonString = decodeURIComponent(uri.slice("data:application/json,".length));
      return JSON.parse(jsonString);
    }
    return null;
  } catch (error) {
    console.error("Failed to parse data URI:", error);
    return null;
  }
}

/**
 * Fetch ERC1155 token URI from contract
 */
export async function fetchTokenUri(
  contractAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<string | null> {
  try {
    // Encode uri(uint256) call
    // uri selector: 0x0e89341c
    const tokenIdBigInt = BigInt(tokenId);
    const tokenIdHex = tokenIdBigInt.toString(16).padStart(64, "0");
    const data = `0x0e89341c${tokenIdHex}`;

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error || !result.result || result.result === "0x") {
      return null;
    }

    // Decode string from ABI-encoded response
    const hex = result.result.slice(2);
    if (hex.length < 128) return null;

    // Get string length (second 32 bytes)
    const lengthHex = hex.slice(64, 128);
    const length = parseInt(lengthHex, 16);

    // Get string data
    const strHex = hex.slice(128, 128 + length * 2);
    const uri = hexToString(strHex);

    return uri;
  } catch (error) {
    console.error("Failed to fetch token URI:", error);
    return null;
  }
}

/**
 * Fetch balance of an address for a specific token ID
 */
export async function fetchTokenBalance(
  contractAddress: string,
  ownerAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<string | null> {
  try {
    // Encode balanceOf(address,uint256) call
    // balanceOf selector: 0x00fdd58e
    const ownerPadded = ownerAddress.toLowerCase().slice(2).padStart(64, "0");
    const tokenIdBigInt = BigInt(tokenId);
    const tokenIdHex = tokenIdBigInt.toString(16).padStart(64, "0");
    const data = `0x00fdd58e${ownerPadded}${tokenIdHex}`;

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error || !result.result || result.result === "0x") {
      return "0";
    }

    const balance = BigInt(result.result).toString();
    return balance;
  } catch (error) {
    console.error("Failed to fetch token balance:", error);
    return null;
  }
}

export interface ERC1155MetadataResult {
  metadata: ERC1155TokenMetadata | null;
  tokenUri: string | null;
}

/**
 * Fetch and parse ERC1155 token metadata
 */
export async function fetchERC1155Metadata(
  contractAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<ERC1155TokenMetadata | null> {
  const result = await fetchERC1155MetadataWithUri(contractAddress, tokenId, rpcUrl);
  return result.metadata;
}

/**
 * Fetch and parse ERC1155 token metadata along with the raw tokenURI
 */
export async function fetchERC1155MetadataWithUri(
  contractAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<ERC1155MetadataResult> {
  // Step 1: Get the token URI from contract
  let uri = await fetchTokenUri(contractAddress, tokenId, rpcUrl);

  if (!uri) {
    return { metadata: null, tokenUri: null };
  }

  // Step 2: Substitute {id} placeholder if present
  uri = substituteTokenId(uri, tokenId);

  // Step 3: Handle different URI schemes
  // Data URI - parse directly
  if (uri.startsWith("data:")) {
    return { metadata: parseDataUri(uri), tokenUri: uri };
  }

  // IPFS or HTTP URI - fetch the metadata
  const httpUri = ipfsToHttp(uri);

  try {
    const response = await fetch(httpUri);
    if (!response.ok) {
      console.error("Failed to fetch metadata:", response.status);
      return { metadata: null, tokenUri: uri };
    }

    const metadata = await response.json();
    return { metadata: metadata as ERC1155TokenMetadata, tokenUri: uri };
  } catch (error) {
    console.error("Failed to fetch/parse metadata:", error);
    return { metadata: null, tokenUri: uri };
  }
}

/**
 * Get display-ready image URL from metadata
 */
export function getImageUrl(metadata: ERC1155TokenMetadata): string | null {
  const image = metadata.image || metadata.animation_url;
  if (!image) return null;
  return ipfsToHttp(image);
}

export interface CollectionInfo {
  name?: string;
  symbol?: string;
}

/**
 * Fetch collection info (name, symbol) from ERC1155 contract
 * Note: ERC1155 doesn't have a standard totalSupply, it's per-token ID
 */
export async function fetchCollectionInfo(
  contractAddress: string,
  rpcUrl: string,
): Promise<CollectionInfo> {
  const info: CollectionInfo = {};

  const calls = [
    { selector: "0x06fdde03", key: "name" }, // name()
    { selector: "0x95d89b41", key: "symbol" }, // symbol()
  ];

  for (const call of calls) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: contractAddress, data: call.selector }, "latest"],
          id: 1,
        }),
      });
      const data = await response.json();
      if (!data.error && data.result && data.result !== "0x") {
        const decoded = decodeAbiString(data.result);
        if (decoded) {
          if (call.key === "name") info.name = decoded;
          if (call.key === "symbol") info.symbol = decoded;
        }
      }
    } catch {
      // Continue on error
    }
  }

  return info;
}
