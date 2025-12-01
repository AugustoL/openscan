/**
 * Network configuration for OpenScan
 * Controls which networks are displayed based on REACT_APP_OPENSCAN_NETWORKS env variable
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  description: string;
  color: string;
  currency: string;
  isTestnet: boolean;
  logoType: "ethereum" | "bsc" | "polygon" | "arbitrum" | "optimism" | "base" | "hardhat";
}

// All available networks
export const ALL_NETWORKS: NetworkConfig[] = [
  {
    chainId: 1,
    name: "Ethereum Mainnet",
    shortName: "Ethereum",
    description: "The main Ethereum network",
    color: "#627EEA",
    currency: "ETH",
    isTestnet: false,
    logoType: "ethereum",
  },
  {
    chainId: 42161,
    name: "Arbitrum One",
    shortName: "Arbitrum",
    description: "Ethereum Layer 2 scaling solution",
    color: "#28A0F0",
    currency: "ETH",
    isTestnet: false,
    logoType: "arbitrum",
  },
  {
    chainId: 10,
    name: "Optimism",
    shortName: "Optimism",
    description: "Ethereum Layer 2 with low fees",
    color: "#FF0420",
    currency: "ETH",
    isTestnet: false,
    logoType: "optimism",
  },
  {
    chainId: 8453,
    name: "Base",
    shortName: "Base",
    description: "Coinbase's Ethereum Layer 2",
    color: "#0052FF",
    currency: "ETH",
    isTestnet: false,
    logoType: "base",
  },
  {
    chainId: 56,
    name: "BSC",
    shortName: "BSC",
    description: "Binance Smart Chain mainnet",
    color: "#F0B90B",
    currency: "BNB",
    isTestnet: false,
    logoType: "bsc",
  },
  {
    chainId: 137,
    name: "Polygon",
    shortName: "Polygon",
    description: "Polygon POS mainnet",
    color: "#8247E5",
    currency: "POL",
    isTestnet: false,
    logoType: "polygon",
  },
  {
    chainId: 31337,
    name: "Localhost",
    shortName: "Localhost",
    description: "Local development network",
    color: "#FFF100",
    currency: "ETH",
    isTestnet: true,
    logoType: "hardhat",
  },
  {
    chainId: 97,
    name: "BSC Testnet",
    shortName: "BSC Testnet",
    description: "Binance Smart Chain testnet",
    color: "#F0B90B",
    currency: "tBNB",
    isTestnet: true,
    logoType: "bsc",
  },
  {
    chainId: 11155111,
    name: "Sepolia Testnet",
    shortName: "Sepolia",
    description: "Ethereum test network for development",
    color: "#F0CDC2",
    currency: "ETH",
    isTestnet: true,
    logoType: "ethereum",
  },
];

/**
 * Get the list of enabled networks based on environment variable
 * REACT_APP_OPENSCAN_NETWORKS can be a comma-separated list of chain IDs
 * If not set, all networks are enabled
 */
export function getEnabledNetworks(): NetworkConfig[] {
  const envNetworks = process.env.REACT_APP_OPENSCAN_NETWORKS;

  console.log("REACT_APP_OPENSCAN_NETWORKS:", envNetworks);

  if (!envNetworks || envNetworks.trim() === "") {
    // Return all networks if env var not set
    console.log("No networks env var set, returning all networks");
    return ALL_NETWORKS;
  }

  // Parse comma-separated chain IDs
  const enabledChainIds = envNetworks
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !Number.isNaN(id));

  console.log("Enabled chain IDs:", enabledChainIds);

  if (enabledChainIds.length === 0) {
    return ALL_NETWORKS;
  }

  // Filter networks by enabled chain IDs, maintaining order from env var
  const enabledNetworks: NetworkConfig[] = [];
  for (const chainId of enabledChainIds) {
    const network = ALL_NETWORKS.find((n) => n.chainId === chainId);
    if (network) {
      enabledNetworks.push(network);
    }
  }

  return enabledNetworks.length > 0 ? enabledNetworks : ALL_NETWORKS;
}

/**
 * Get enabled chain IDs as an array
 */
export function getEnabledChainIds(): number[] {
  return getEnabledNetworks().map((n) => n.chainId);
}

/**
 * Check if a chain ID is enabled
 */
export function isChainEnabled(chainId: number): boolean {
  return getEnabledChainIds().includes(chainId);
}

/**
 * Get network config by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return ALL_NETWORKS.find((n) => n.chainId === chainId);
}
