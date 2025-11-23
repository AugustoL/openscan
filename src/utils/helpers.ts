import { ethers } from "ethers";

// MaxUint256 constant for unlimited allowance detection
const MAX_UINT256 = BigInt(
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);

/**
 * Safely format token units, handling edge case where decimals is 0 and unlimited allowances
 * @param value - BigInt or string value to format
 * @param decimals - Number of decimals (can be 0)
 * @returns Formatted string representation
 */
export function safeFormatUnits(
	value: bigint | string,
	decimals: number = 18,
): string {
	// Convert to BigInt if it's a string
	const bigIntValue = typeof value === "string" ? BigInt(value) : value;

	// Check for unlimited allowance (MaxUint256) before formatting
	if (bigIntValue === MAX_UINT256) {
		return "Unlimited";
	}

	// For tokens with fewer decimals, check if this is a practical "unlimited" amount
	// A value is considered unlimited if it's > 10^(decimals + 18)
	// This catches cases where someone approves a very large but not max-uint256 amount
	const unlimitedThreshold = BigInt(10 ** (decimals + 18));
	if (bigIntValue >= unlimitedThreshold) {
		return "Unlimited";
	}

	if (decimals === 0) {
		// For tokens with 0 decimals, the value is already in its final form
		return bigIntValue.toString();
	}

	try {
		return ethers.formatUnits(bigIntValue, decimals);
	} catch (error) {
		console.warn("Error formatting units:", error);
		return "0";
	}
}

/**
 * Safely parse token units, handling edge case where decimals is 0
 * @param value - String value to parse
 * @param decimals - Number of decimals (can be 0)
 * @returns Parsed BigInt value
 */
export function safeParseUnits(value: string, decimals: number = 18): bigint {
	if (decimals === 0) {
		// For tokens with 0 decimals, parse as integer
		try {
			return BigInt(value.trim());
		} catch (error) {
			console.warn("Error parsing integer:", error);
			return BigInt(0);
		}
	}

	try {
		return ethers.parseUnits(value.trim(), decimals);
	} catch (error) {
		console.warn("Error parsing units:", error);
		return BigInt(0);
	}
}

/**
 * Format a token amount with proper decimal handling and locale formatting
 * @param value - BigInt value to format
 * @param decimals - Number of decimals
 * @param options - Locale formatting options
 * @returns Formatted string with proper decimal places
 */
export function formatTokenAmount(
	value: bigint | string | undefined,
	decimals: number = 18,
	options?: Intl.NumberFormatOptions,
): string {
	if (value === undefined) {
		console.warn("formatTokenAmount called with undefined value");
		return "0";
	}
	if (typeof value === "string") {
		value = safeParseUnits(value, decimals);
	}

	const formatted = safeFormatUnits(value, decimals);

	if (decimals === 0) {
		// For integer tokens, use integer formatting
		return Number(formatted).toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
			...options,
		});
	}

	// For decimal tokens, use appropriate decimal formatting
	return Number(formatted).toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: Math.min(decimals, 4), // Cap at 4 decimal places for display
		...options,
	});
}

export const formatAmount = (
	amount: string | undefined,
	minDecimals: number = 0,
	maxDecimals: number = 4,
	options?: Intl.NumberFormatOptions,
): string => {
	if (!amount || amount === "0") return "0";

	// Check for 'Unlimited' string (already processed by safeFormatUnits)
	if (amount === "Unlimited") return "Unlimited";

	const num = parseFloat(amount);

	if (num === 0) return "0";

	// For decimal tokens, use appropriate decimal formatting
	return Number(num).toLocaleString(undefined, {
		minimumFractionDigits: minDecimals,
		maximumFractionDigits: maxDecimals,
		...options,
	});
};

export const getTokenType = (
	chainId: number,
	tokenAddress: string,
	symbol: string,
): string => {
	// Normalize token address to lowercase for comparison
	const normalizedAddress = tokenAddress.toLowerCase();

	// Common token type mappings by chain
	const tokenTypes: Record<number, Record<string, string>> = {
		// Ethereum Mainnet (Chain ID: 1)
		1: {
			"0xa0b86a33e6441ecb12e6eced5ca5e3aa8c2a4c6e": "LST", // stETH (Lido Staked Ether)
			"0xae7ab96520de3a18e5e111b5eaab095312d7fe84": "LST", // stETH
			"0xbe9895146f7af43049ca1c1ae358b0541ea49704": "LST", // cbETH (Coinbase Wrapped Staked ETH)
			"0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb": "LST", // sETH2 (StakeHound Staked Ether)
			"0x6b175474e89094c44da98b954eedeac495271d0f": "Stablecoin", // DAI
			"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "Stablecoin", // USDC
			"0xdac17f958d2ee523a2206206994597c13d831ec7": "Stablecoin", // USDT
			"0x4fabb145d64652a948d72533023f6e7a623c7c53": "Stablecoin", // BUSD
			"0x853d955acef822db058eb8505911ed77f175b99e": "Stablecoin", // FRAX
			"0x956f47f50a910163d8bf957cf5846d573e7f87ca": "Stablecoin", // FEI
			"0x8e870d67f660d95d5be530380d0ec0bd388289e1": "Wrapped", // PAXG
			"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "Wrapped", // WBTC
			"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "Wrapped", // WETH
		},
		// Arbitrum One (Chain ID: 42161)
		42161: {
			"0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "Wrapped", // WETH
			"0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": "Wrapped", // WBTC
			"0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "Stablecoin", // USDC
			"0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "Stablecoin", // USDT
			"0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": "Stablecoin", // DAI
		},
		// Polygon (Chain ID: 137)
		137: {
			"0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": "Wrapped", // WMATIC
			"0x7ceb23fd6c950e95d5718b0c3e96d6b46de8c1c5": "Wrapped", // WETH
			"0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": "Wrapped", // WBTC
			"0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "Stablecoin", // USDC
			"0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "Stablecoin", // USDT
			"0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": "Stablecoin", // DAI
		},
	};

	// Check if we have a specific mapping for this chain and token
	const chainTokens = tokenTypes[chainId];
	if (chainTokens && chainTokens[normalizedAddress]) {
		return chainTokens[normalizedAddress];
	}

	// Fallback to symbol-based detection
	const upperSymbol = symbol.toUpperCase();

	// Wrapped tokens
	if (upperSymbol.startsWith("W") && upperSymbol.length <= 5) {
		return "Wrapped";
	}

	// Stablecoins
	if (
		upperSymbol.includes("USD") ||
		upperSymbol === "DAI" ||
		upperSymbol === "FRAX" ||
		upperSymbol === "LUSD" ||
		upperSymbol === "USDC" ||
		upperSymbol === "USDT" ||
		upperSymbol === "BUSD" ||
		upperSymbol === "TUSD"
	) {
		return "Stablecoin";
	}

	// Liquid Staking Tokens
	if (
		(upperSymbol.includes("ST") && upperSymbol.includes("ETH")) ||
		upperSymbol.startsWith("ST") ||
		upperSymbol.includes("LST") ||
		upperSymbol === "RETH" ||
		upperSymbol === "CBETH"
	) {
		return "LST";
	}

	// LP tokens
	if (
		upperSymbol.includes("LP") ||
		upperSymbol.includes("-") ||
		upperSymbol.includes("UNI") ||
		upperSymbol.includes("SLP")
	) {
		return "LP Token";
	}

	// Default fallback
	return "ERC-20";
};

/**
 * Check if contracts are deployed for a given chain ID
 * @param chainId - The chain ID to check
 * @returns true if ERC20FlashLender contract is deployed with a real address
 */
export function hasContractsDeployed(chainId: number): boolean {
	try {
		const { getContractAddress } = require("../config");
		const flashLenderAddress = getContractAddress("ERC20FlashLender", chainId);
		// Check if we have a valid address (not null, undefined, or placeholder)
		if (!flashLenderAddress) return false;

		// Check for common placeholder addresses
		const placeholderAddresses = [
			"0x1234567890123456789012345678901234567890",
			"0x0000000000000000000000000000000000000000",
		];

		return !placeholderAddresses.includes(flashLenderAddress.toLowerCase());
	} catch (error) {
		console.warn("Error checking contract deployment:", error);
		return false;
	}
}
