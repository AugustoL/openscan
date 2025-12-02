import type { Chain } from "wagmi/chains";
import { arbitrum, base, hardhat, mainnet, optimism, polygon, sepolia } from "wagmi/chains";
import jsonConfig from "./config.json";

// Contract addresses
export const OPENSCAN_PAYMENT_ADDRESS = "0xd5bd7a2d6e13d351e157e2a0396dac810d6af390";

export interface Network {
  chainId: number;
  name: string;
  currency: string;
}

export interface Config {
  networks: Network[];
}

/**
 * Get the configuration with the contracts and networks
 */
export function getConfig(): Config {
  return jsonConfig;
}

/**
 * Get network configuration by chain ID
 * @param chainId - Chain ID
 * @returns Network configuration or null if not found
 */
export function getNetworkConfig(chainId: number): Network | null {
  const config = getConfig();
  return config.networks.find((n) => n.chainId === chainId) || null;
}

/**
 * Get all supported networks
 * @returns Array of all supported networks
 */
export function getAllNetworks(): Network[] {
  const config = getConfig();
  return config.networks;
}

/**
 * Get supported wagmi chains based on the configuration
 * Maps chain IDs from config to wagmi chain objects
 * @returns Array of wagmi Chain objects
 */
export function getSupportedChains(): Chain[] {
  const config = getConfig();
  const chainMap: Record<number, Chain> = {
    1: mainnet,
    137: polygon,
    10: optimism,
    42161: arbitrum,
    8453: base,
    11155111: sepolia,
    31337: hardhat,
  };

  return config.networks
    .map((network) => chainMap[network.chainId])
    .filter((chain): chain is Chain => chain !== undefined);
}
