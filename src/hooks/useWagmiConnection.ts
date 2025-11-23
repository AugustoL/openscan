import { useAccount, useConnections } from "wagmi";
import { useEffect, useState } from "react";

/**
 * Custom hook to track wagmi connection state with detailed information
 */
export const useWagmiConnection = () => {
	const {
		isConnected,
		isConnecting,
		isReconnecting,
		isDisconnected,
		address,
		connector,
		status,
	} = useAccount();

	const connections = useConnections();
	const [isFullyConnected, setIsFullyConnected] = useState(false);

	useEffect(() => {
		// Consider fully connected when:
		// 1. Account is connected
		// 2. We have an address
		// 3. Connection is stable (not connecting/reconnecting)
		const fullyConnected =
			isConnected &&
			!!address &&
			!isConnecting &&
			!isReconnecting &&
			connections.length > 0;

		setIsFullyConnected(fullyConnected);
	}, [isConnected, address, isConnecting, isReconnecting, connections.length]);

	return {
		// Basic states
		isConnected,
		isConnecting,
		isReconnecting,
		isDisconnected,

		// Address and connector info
		address,
		connector,

		// Connection details
		connections,
		activeConnection: connections[0],

		// Computed states
		isFullyConnected,
		isStableConnection: isConnected && !isConnecting && !isReconnecting,

		// Status information
		status,
		connectionCount: connections.length,

		// Utility methods
		hasValidAddress: !!address && address !== "0x",

		// Loading states for UI
		showConnectWallet: !isConnected || !address,
		showLoading: isConnecting || isReconnecting,
	};
};

/**
 * Hook to execute callback when wagmi is fully connected
 */
export const useOnWagmiConnected = (
	callback: (address: string) => void,
	deps: any[] = [],
) => {
	const { isFullyConnected, address } = useWagmiConnection();

	useEffect(() => {
		if (isFullyConnected && address) {
			callback(address);
		}
	}, [isFullyConnected, address, callback, ...deps]); // Include callback in dependencies
};
