import { ethers } from "ethers";

/**
 * Security utilities for Web3 provider interactions
 */

export interface ProviderSecurity {
	isMetaMaskInstalled: boolean;
	isProviderTrusted: boolean;
	providerVersion?: string;
	chainId?: number;
	warnings: string[];
}

/**
 * Enhanced provider detection with security checks
 */
export async function checkProviderSecurity(): Promise<ProviderSecurity> {
	const warnings: string[] = [];
	let isMetaMaskInstalled = false;
	let isProviderTrusted = false;
	let providerVersion: string | undefined;
	let chainId: number | undefined;

	try {
		// Check if window.ethereum exists
		if (!window.ethereum) {
			warnings.push("No Web3 provider detected. Please install MetaMask.");
			return {
				isMetaMaskInstalled: false,
				isProviderTrusted: false,
				warnings,
			};
		}

		isMetaMaskInstalled = true;

		// Check if it's MetaMask specifically
		if (!window.ethereum.isMetaMask) {
			warnings.push("Non-MetaMask provider detected. Proceed with caution.");
		}

		// Check provider version
		if (window.ethereum._metamask?.version) {
			providerVersion = window.ethereum._metamask.version;
		}

		// EIP-1193 compliance check
		if (typeof window.ethereum.request !== "function") {
			warnings.push("Provider does not support EIP-1193 standard.");
			return {
				isMetaMaskInstalled,
				isProviderTrusted: false,
				providerVersion,
				warnings,
			};
		}

		// Check connection and chain ID
		try {
			const chainIdHex = await window.ethereum.request({
				method: "eth_chainId",
			});
			chainId = parseInt(chainIdHex, 16);

			// Warn about testnets in production
			if (process.env.NODE_ENV === "production" && chainId !== 1) {
				warnings.push(
					`Connected to non-mainnet network (Chain ID: ${chainId}). Ensure this is intentional.`,
				);
			}
		} catch (error) {
			warnings.push("Unable to retrieve chain information.");
		}

		// Check if provider is connected
		try {
			const accounts = await window.ethereum.request({
				method: "eth_accounts",
			});
			if (!accounts || accounts.length === 0) {
				warnings.push("Wallet is not connected.");
			}
		} catch (error) {
			warnings.push("Unable to check wallet connection status.");
		}

		isProviderTrusted = warnings.length === 0;
	} catch (error) {
		warnings.push(
			`Provider security check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}

	return {
		isMetaMaskInstalled,
		isProviderTrusted,
		providerVersion,
		chainId,
		warnings,
	};
}

/**
 * Secure signer creation with additional checks
 */
export async function createSecureSigner(): Promise<ethers.Signer> {
	const security = await checkProviderSecurity();

	if (!security.isMetaMaskInstalled) {
		throw new Error(
			"MetaMask is not installed. Please install MetaMask to continue.",
		);
	}

	if (security.warnings.length > 0) {
		console.warn("Web3 Security Warnings:", security.warnings);
	}

	if (!window.ethereum) {
		throw new Error("No Web3 provider available");
	}

	try {
		// Force MetaMask provider instead of using local RPC

		// Request account access if needed
		const accounts = await window.ethereum.request({
			method: "eth_requestAccounts",
		});
		if (!accounts || accounts.length === 0) {
			throw new Error("No accounts available. Please connect your wallet.");
		}

		// Create provider and signer
		const provider = new ethers.BrowserProvider(window.ethereum);
		const signer = await provider.getSigner();

		// Verify signer address
		const address = await signer.getAddress();
		if (!address || address === "0x0000000000000000000000000000000000000000") {
			throw new Error("Invalid signer address received");
		}

		console.log("✅ Secure signer created:", address);
		return signer;
	} catch (error) {
		console.error("❌ Error creating secure signer:", error);
		throw new Error(
			`Failed to create secure signer: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Validate transaction parameters before signing
 */
export function validateTransactionSecurity(
	to: string,
	data: string,
	value?: string,
): { isValid: boolean; warnings: string[] } {
	const warnings: string[] = [];
	let isValid = true;

	// Check recipient address
	if (!to || to === "0x0000000000000000000000000000000000000000") {
		warnings.push("Invalid recipient address");
		isValid = false;
	}

	// Check if it's a contract interaction
	if (data && data.length > 2) {
		// Basic checks for suspicious patterns
		if (data.includes("selfdestruct") || data.includes("suicide")) {
			warnings.push("Transaction contains potentially dangerous operations");
			isValid = false;
		}
	}

	// Check value
	if (value) {
		try {
			const valueWei = ethers.parseEther(value);
			if (valueWei > ethers.parseEther("100")) {
				// More than 100 ETH
				warnings.push(
					"Large value transfer detected. Please verify the amount.",
				);
			}
		} catch (error) {
			warnings.push("Invalid value format");
			isValid = false;
		}
	}

	return { isValid, warnings };
}

/**
 * Hook for using secure Web3 operations
 */
export function useSecureWeb3() {
	const createSigner = async () => {
		return await createSecureSigner();
	};

	const checkSecurity = async () => {
		return await checkProviderSecurity();
	};

	return {
		createSigner,
		checkSecurity,
		validateTransaction: validateTransactionSecurity,
	};
}
