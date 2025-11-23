// src/hooks/useDataService.ts
import { useContext, useMemo } from "react";
import { DataService } from "../services/DataService";
import { AppContext } from "../context/AppContext";

/**
 * Hook to get a DataService for a specific chain
 * @param chainId - Optional chain ID. If not provided, uses the currently connected chain
 * @returns DataService instance
 */
export function useDataService(chainId: number) {
	const targetChainId = chainId;
	const { rpcUrls } = useContext(AppContext);

	console.log(
		"useDataService called with chainId:",
		chainId,
		"targetChainId:",
		targetChainId,
	);

	const dataService = useMemo(() => {
		console.log("useMemo creating new DataService for chainId:", targetChainId);
		return new DataService(targetChainId, rpcUrls);
	}, [targetChainId, rpcUrls]);

	console.log(
		"useDataService returning dataService for chainId:",
		targetChainId,
	);
	return dataService;
}
