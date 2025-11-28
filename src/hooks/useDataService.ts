// src/hooks/useDataService.ts
import { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { useSettings } from "../context/SettingsContext";
import { DataService } from "../services/DataService";

/**
 * Hook to get a DataService for a specific chain
 * Automatically applies the RPC strategy from user settings
 * @param chainId - Optional chain ID. If not provided, uses the currently connected chain
 * @returns DataService instance
 */
export function useDataService(chainId: number) {
	const targetChainId = chainId;
	const { rpcUrls } = useContext(AppContext);
	const { settings } = useSettings();

	console.log(
		"useDataService called with chainId:",
		chainId,
		"targetChainId:",
		targetChainId,
		"strategy:",
		settings.rpcStrategy,
	);

	const dataService = useMemo(() => {
		console.log(
			"useMemo creating new DataService for chainId:",
			targetChainId,
			"with strategy:",
			settings.rpcStrategy,
		);
		return new DataService(targetChainId, rpcUrls, settings.rpcStrategy);
	}, [targetChainId, rpcUrls, settings.rpcStrategy]);

	console.log(
		"useDataService returning dataService for chainId:",
		targetChainId,
	);
	return dataService;
}
