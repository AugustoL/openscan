/**
 * ERC721 Token Metadata Utilities
 * Handles fetching and parsing ERC721 NFT token metadata from various URI formats
 */

import { decodeAbiString, hexToString } from "./hexUtils";

export interface ERC721TokenMetadata {
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
 * Parse data URI (base64 encoded JSON)
 */
function parseDataUri(uri: string): ERC721TokenMetadata | null {
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
 * Fetch ERC721 tokenURI from contract
 */
export async function fetchTokenUri(
  contractAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<string | null> {
  try {
    // Encode tokenURI(uint256) call
    // tokenURI selector: 0xc87b56dd
    const tokenIdBigInt = BigInt(tokenId);
    const tokenIdHex = tokenIdBigInt.toString(16).padStart(64, "0");
    const data = `0xc87b56dd${tokenIdHex}`;

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
 * Fetch owner of a specific token ID
 */
export async function fetchTokenOwner(
  contractAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<string | null> {
  try {
    // Encode ownerOf(uint256) call
    // ownerOf selector: 0x6352211e
    const tokenIdBigInt = BigInt(tokenId);
    const tokenIdHex = tokenIdBigInt.toString(16).padStart(64, "0");
    const data = `0x6352211e${tokenIdHex}`;

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

    // Decode address from response (last 40 hex chars)
    const hex = result.result.slice(2);
    if (hex.length < 40) return null;

    const address = `0x${hex.slice(-40)}`;
    return address;
  } catch (error) {
    console.error("Failed to fetch token owner:", error);
    return null;
  }
}

/**
 * Fetch approved address for a specific token ID
 */
export async function fetchTokenApproval(
  contractAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<string | null> {
  try {
    // Encode getApproved(uint256) call
    // getApproved selector: 0x081812fc
    const tokenIdBigInt = BigInt(tokenId);
    const tokenIdHex = tokenIdBigInt.toString(16).padStart(64, "0");
    const data = `0x081812fc${tokenIdHex}`;

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

    // Decode address from response
    const hex = result.result.slice(2);
    if (hex.length < 40) return null;

    const address = `0x${hex.slice(-40)}`;
    // Return null for zero address (no approval)
    if (address === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return address;
  } catch (error) {
    console.error("Failed to fetch token approval:", error);
    return null;
  }
}

export interface ERC721MetadataResult {
  metadata: ERC721TokenMetadata | null;
  tokenUri: string | null;
}

/**
 * Fetch and parse ERC721 token metadata
 */
export async function fetchERC721Metadata(
  contractAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<ERC721TokenMetadata | null> {
  const result = await fetchERC721MetadataWithUri(contractAddress, tokenId, rpcUrl);
  return result.metadata;
}

/**
 * Fetch and parse ERC721 token metadata along with the raw tokenURI
 */
export async function fetchERC721MetadataWithUri(
  contractAddress: string,
  tokenId: string,
  rpcUrl: string,
): Promise<ERC721MetadataResult> {
  // Step 1: Get the token URI from contract
  const uri = await fetchTokenUri(contractAddress, tokenId, rpcUrl);

  if (!uri) {
    return { metadata: null, tokenUri: null };
  }

  // Step 2: Handle different URI schemes
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
    return { metadata: metadata as ERC721TokenMetadata, tokenUri: uri };
  } catch (error) {
    console.error("Failed to fetch/parse metadata:", error);
    return { metadata: null, tokenUri: uri };
  }
}

/**
 * Get display-ready image URL from metadata
 */
export function getImageUrl(metadata: ERC721TokenMetadata): string | null {
  const image = metadata.image || metadata.animation_url;
  if (!image) return null;
  return ipfsToHttp(image);
}

export interface CollectionInfo {
  name?: string;
  symbol?: string;
  totalSupply?: string;
}

/**
 * Fetch collection info (name, symbol, totalSupply) from ERC721 contract
 */
export async function fetchCollectionInfo(
  contractAddress: string,
  rpcUrl: string,
): Promise<CollectionInfo> {
  const info: CollectionInfo = {};

  const calls = [
    { selector: "0x06fdde03", key: "name" }, // name()
    { selector: "0x95d89b41", key: "symbol" }, // symbol()
    { selector: "0x18160ddd", key: "totalSupply" }, // totalSupply()
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
        if (call.key === "totalSupply") {
          info.totalSupply = BigInt(data.result).toString();
        } else {
          const decoded = decodeAbiString(data.result);
          if (decoded) {
            if (call.key === "name") info.name = decoded;
            if (call.key === "symbol") info.symbol = decoded;
          }
        }
      }
    } catch {
      // Continue on error
    }
  }

  return info;
}
