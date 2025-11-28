import {
	keccak256,
	toUtf8Bytes,
	hexlify,
	AbiCoder,
	solidityPackedKeccak256,
} from "ethers";

export type SolidityType =
	| "string"
	| "bytes"
	| "address"
	| "uint256"
	| "uint128"
	| "uint64"
	| "uint32"
	| "uint8"
	| "int256"
	| "bool"
	| "bytes32"
	| "bytes4";

export type EthUnit = "eth" | "finney" | "szabo" | "gwei" | "mwei" | "kwei" | "wei";

export interface KeccakResults {
	encodedBytes?: string;
	rawHash?: string;
	solidityEncodePacked?: string;
	solidityEncode?: string;
	functionSelector?: string | null;
	isFunctionSignature?: boolean;
	error?: string;
}

// Unit conversion: decimals relative to wei (wei has 0 decimals)
const UNIT_DECIMALS: Record<EthUnit, number> = {
	eth: 18,
	finney: 15,
	szabo: 12,
	gwei: 9,
	mwei: 6,
	kwei: 3,
	wei: 0,
};

/**
 * Format a value with appropriate decimals for the unit
 * Smaller units should have fewer decimals
 */
function formatUnitValue(weiValue: bigint, unit: EthUnit): string {
	const decimals = UNIT_DECIMALS[unit];
	
	if (decimals === 0) {
		// Wei: no decimals, just return the integer
		return weiValue.toString();
	}
	
	// Calculate 10^decimals without ** operator
	let divisor = BigInt(1);
	for (let i = 0; i < decimals; i++) {
		divisor = divisor * BigInt(10);
	}
	
	const integerPart = weiValue / divisor;
	const remainder = weiValue % divisor;
	
	if (remainder === BigInt(0)) {
		return integerPart.toString();
	}
	
	// Format the fractional part with leading zeros
	let fractionalStr = remainder.toString().padStart(decimals, '0');
	
	// Remove trailing zeros
	fractionalStr = fractionalStr.replace(/0+$/, '');
	
	if (fractionalStr === '') {
		return integerPart.toString();
	}
	
	return `${integerPart}.${fractionalStr}`;
}

/**
 * Parse a decimal string to wei (bigint)
 */
function parseToWei(value: string, fromUnit: EthUnit): bigint | null {
	const trimmed = value.trim();
	if (!trimmed || trimmed === '') return null;
	
	const decimals = UNIT_DECIMALS[fromUnit];
	
	// Split into integer and fractional parts
	const parts = trimmed.split('.');
	const integerPart = parts[0] || '0';
	let fractionalPart = parts[1] || '';
	
	// Validate parts are numeric
	if (!/^\d*$/.test(integerPart) || !/^\d*$/.test(fractionalPart)) {
		return null;
	}
	
	// Pad or truncate fractional part to match decimals
	if (fractionalPart.length > decimals) {
		fractionalPart = fractionalPart.slice(0, decimals);
	} else {
		fractionalPart = fractionalPart.padEnd(decimals, '0');
	}
	
	// Combine integer and fractional parts
	const combined = integerPart + fractionalPart;
	
	try {
		return BigInt(combined);
	} catch {
		return null;
	}
}

/**
 * Convert an amount from one Ethereum unit to all other units
 */
export function convertEthUnits(
	value: string,
	from: EthUnit
): Record<EthUnit, string> | null {
	const weiValue = parseToWei(value, from);
	if (weiValue === null) return null;

	return {
		eth: formatUnitValue(weiValue, 'eth'),
		finney: formatUnitValue(weiValue, 'finney'),
		szabo: formatUnitValue(weiValue, 'szabo'),
		gwei: formatUnitValue(weiValue, 'gwei'),
		mwei: formatUnitValue(weiValue, 'mwei'),
		kwei: formatUnitValue(weiValue, 'kwei'),
		wei: formatUnitValue(weiValue, 'wei'),
	};
}

/**
 * Parse an input value according to its Solidity type
 */
export function parseInputValue(input: string, type: SolidityType): any {
	const trimmed = input.trim();
	switch (type) {
		case "string":
			return trimmed;
		case "bytes":
		case "bytes32":
		case "bytes4":
			return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
		case "address":
			if (
				!/^0x[0-9a-fA-F]{40}$/i.test(trimmed) &&
				!/^[0-9a-fA-F]{40}$/i.test(trimmed)
			) {
				throw new Error("Invalid address format (expected 40 hex chars)");
			}
			return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
		case "uint256":
		case "uint128":
		case "uint64":
		case "uint32":
		case "uint8":
		case "int256":
			return BigInt(trimmed);
		case "bool":
			return trimmed.toLowerCase() === "true" || trimmed === "1";
		default:
			return trimmed;
	}
}

/**
 * Compute keccak256 hash and related outputs
 */
export function computeKeccak(
	input: string,
	inputType: SolidityType
): KeccakResults {
	if (!input.trim()) {
		return {};
	}

	try {
		const abiCoder = AbiCoder.defaultAbiCoder();
		const parsedValue = parseInputValue(input, inputType);

		let encodedHex: string;
		if (inputType === "string") {
			encodedHex = hexlify(toUtf8Bytes(input));
		} else if (typeof parsedValue === "bigint") {
			encodedHex = "0x" + parsedValue.toString(16).padStart(64, "0");
		} else {
			encodedHex = parsedValue;
		}

		const rawBytes = toUtf8Bytes(input);
		const rawHash = keccak256(rawBytes);

		const solidityEncodePacked = solidityPackedKeccak256(
			[inputType],
			[parsedValue]
		);

		const abiEncoded = abiCoder.encode([inputType], [parsedValue]);
		const solidityEncode = keccak256(abiEncoded);

		const functionSigPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)$/;
		const isFunctionSignature =
			inputType === "string" && functionSigPattern.test(input.trim());
		const functionSelector = isFunctionSignature ? rawHash.slice(0, 10) : null;

		return {
			encodedBytes: encodedHex,
			rawHash,
			solidityEncodePacked,
			solidityEncode,
			functionSelector,
			isFunctionSignature,
		};
	} catch (err: any) {
		return { error: err.message || "Failed to compute hash" };
	}
}

/**
 * Convert a string to hex
 */
export function stringToHex(data: string): string {
	if (data.startsWith("0x")) {
		return data;
	}

	return (
		"0x" +
		Array.from(data)
			.map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
			.join("")
	);
}

/**
 * Convert hex to string
 */
export function hexToString(hexData: string): string {
	if (!hexData.startsWith("0x")) {
		throw new Error("Invalid hex format (must start with 0x)");
	}

	const hex = hexData.slice(2);
	return (
		hex
			.match(/.{1,2}/g)
			?.map((byte) => String.fromCharCode(parseInt(byte, 16)))
			.join("") || ""
	);
}

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
	return /^0x[0-9a-fA-F]{40}$/i.test(address);
}

/**
 * Check if a string is valid hex
 */
export function isValidHex(hex: string): boolean {
	return /^0x[0-9a-fA-F]*$/i.test(hex);
}

/**
 * Check if a hex string is a valid signature (64 or 65 bytes)
 */
export function isValidSignature(sig: string): { valid: boolean; length: number; format: string } {
	if (!sig.startsWith("0x")) {
		return { valid: false, length: 0, format: "Invalid" };
	}
	
	const hexWithoutPrefix = sig.slice(2);
	if (!/^[0-9a-fA-F]*$/i.test(hexWithoutPrefix)) {
		return { valid: false, length: 0, format: "Invalid" };
	}
	
	const byteLength = hexWithoutPrefix.length / 2;
	
	if (byteLength === 64) {
		return { valid: true, length: 64, format: "EIP-2098 Compact (64 bytes)" };
	} else if (byteLength === 65) {
		return { valid: true, length: 65, format: "Standard (65 bytes)" };
	}
	
	return { valid: false, length: byteLength, format: "Invalid" };
}

/**
 * Detect the message format for signature verification
 */
export function detectMessageFormat(message: string): "hash" | "eip712" | "personal" {
	if (message.startsWith("0x") && message.length === 66) {
		// Check if it's a valid 32-byte hash
		const hexWithoutPrefix = message.slice(2);
		if (/^[0-9a-fA-F]{64}$/i.test(hexWithoutPrefix)) {
			return "hash";
		}
	}
	
	if (message.trim().startsWith("{")) {
		try {
			const parsed = JSON.parse(message);
			if (parsed.domain && parsed.types && parsed.message) {
				return "eip712";
			}
		} catch {
			// Not valid JSON
		}
	}
	
	return "personal";
}

/**
 * Extract r, s, v components from a signature hex string
 */
export function parseSignatureComponents(sig: string): {
	r: string;
	s: string;
	v: number;
	yParity: number;
} | null {
	if (!sig.startsWith("0x")) return null;
	
	const hexWithoutPrefix = sig.slice(2);
	
	// Validate hex characters
	if (!/^[0-9a-fA-F]*$/i.test(hexWithoutPrefix)) {
		return null;
	}
	
	const byteLength = hexWithoutPrefix.length / 2;
	
	// Only accept exactly 64 or 65 bytes
	if (byteLength !== 64 && byteLength !== 65) {
		return null;
	}
	
	if (byteLength === 65) {
		// Standard signature: r (32 bytes) || s (32 bytes) || v (1 byte)
		const r = "0x" + hexWithoutPrefix.slice(0, 64);
		const s = "0x" + hexWithoutPrefix.slice(64, 128);
		const vByte = parseInt(hexWithoutPrefix.slice(128, 130), 16);
		// v is either 27/28 or 0/1
		const v = vByte < 27 ? vByte + 27 : vByte;
		const yParity = v - 27;
		return { r, s, v, yParity };
	} else if (byteLength === 64) {
		// EIP-2098 compact: r (32 bytes) || yParityAndS (32 bytes)
		const r = "0x" + hexWithoutPrefix.slice(0, 64);
		const yParityAndS = hexWithoutPrefix.slice(64, 128);
		// yParity is encoded in the highest bit of s
		const firstChar = yParityAndS.charAt(0);
		const yParity = parseInt(firstChar, 16) >= 8 ? 1 : 0;
		// Clear the highest bit to get s
		const sFirstNibble = (parseInt(firstChar, 16) & 0x7).toString(16);
		const s = "0x" + sFirstNibble + yParityAndS.slice(1);
		const v = yParity + 27;
		return { r, s, v, yParity };
	}
	
	return null;
}

/**
 * Check if two addresses match (case-insensitive)
 */
export function addressesMatch(addr1: string, addr2: string): boolean {
	if (!addr1 || !addr2) return false;
	return addr1.toLowerCase() === addr2.toLowerCase();
}
