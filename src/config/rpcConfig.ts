// src/config/rpcConfig.ts
import { RpcUrlsContextType } from "../types";

/**
 * Get RPC URLs for a given chain ID (returns array for fallback support)
 * @param chainId - The chain ID to get RPC URLs for
 * @param rpcUrlsMap - Optional RPC URLs map from context/storage. Falls back to RPC_ENDPOINTS if not provided
 */
export function getRPCUrls(
	chainId: number,
	rpcUrlsMap: RpcUrlsContextType,
): string[] {
	const effectiveMap = rpcUrlsMap;
	const urls = effectiveMap[chainId as keyof RpcUrlsContextType];
	if (!urls || urls.length === 0) {
		throw new Error(`No RPC endpoint configured for chain ID ${chainId}`);
	}
	return urls;
}
