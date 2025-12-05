/**
 * Shared hex decoding utilities for browser-compatible string conversion.
 * Used for decoding ABI-encoded strings from RPC responses.
 */

/**
 * Convert a hex string to a UTF-8 string.
 * Stops at first null character (0x00).
 * Browser-compatible alternative to Node.js Buffer.from(hex, "hex").toString("utf8")
 */
export function hexToString(hex: string): string {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.slice(i, i + 2), 16);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str;
}

/**
 * Decode an ABI-encoded string from a hex response.
 * ABI-encoded strings have the format:
 * - bytes 0-32: offset to string data (usually 0x20 = 32)
 * - bytes 32-64: string length
 * - bytes 64+: string data (padded to 32 bytes)
 *
 * @param hex - The hex string including "0x" prefix
 * @returns The decoded string, or empty string on error
 */
export function decodeAbiString(hex: string): string {
  try {
    const data = hex.slice(2); // Remove "0x" prefix
    if (data.length >= 128) {
      const lengthHex = data.slice(64, 128);
      const length = parseInt(lengthHex, 16);
      const strHex = data.slice(128, 128 + length * 2);
      return hexToString(strHex);
    }
    return "";
  } catch {
    return "";
  }
}
