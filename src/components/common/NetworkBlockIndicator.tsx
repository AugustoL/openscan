import { useEffect, useState, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { RPCClient } from "../../services/EVM/common/RPCClient";
import { getRPCUrls } from "../../config/rpcConfig";

// Network configuration with logos
import arbitrumLogo from "../../assets/arbitrum-logo.svg";
import optimismLogo from "../../assets/optimism-logo.svg";
import baseLogo from "../../assets/base-logo.svg";
import hardhatLogo from "../../assets/hardhat-logo.svg";

interface NetworkInfo {
	name: string;
	logo: string | null;
	color: string;
}

const NETWORK_INFO: Record<number, NetworkInfo> = {
	1: { name: "Ethereum", logo: null, color: "#627EEA" },
	11155111: { name: "Sepolia", logo: null, color: "#F0CDC2" },
	42161: { name: "Arbitrum", logo: arbitrumLogo, color: "#28A0F0" },
	10: { name: "Optimism", logo: optimismLogo, color: "#FF0420" },
	8453: { name: "Base", logo: baseLogo, color: "#0052FF" },
	56: { name: "BSC", logo: null, color: "#F0B90B" },
	97: { name: "BSC Testnet", logo: null, color: "#F0B90B" },
	31337: { name: "Localhost", logo: hardhatLogo, color: "#FFF100" },
};

// Ethereum SVG for networks without a logo
const EthereumIcon = ({ color }: { color: string }) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 256 417"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fill={color}
			d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"
		/>
		<path fill={`${color}99`} d="M127.962 0 0 212.32l127.962 75.639V154.158z" />
		<path
			fill={color}
			d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z"
		/>
		<path fill={`${color}99`} d="M127.962 416.905v-104.72L0 236.585z" />
	</svg>
);

interface NetworkBlockIndicatorProps {
	className?: string;
}

export function NetworkBlockIndicator({
	className,
}: NetworkBlockIndicatorProps) {
	const location = useLocation();
	const { rpcUrls } = useContext(AppContext);
	const [blockNumber, setBlockNumber] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Extract chainId from the pathname (e.g., /1/blocks -> 1)
	const chainId = useMemo(() => {
		const pathSegments = location.pathname.split("/").filter(Boolean);
		return pathSegments[0] && !isNaN(Number(pathSegments[0]))
			? Number(pathSegments[0])
			: null;
	}, [location.pathname]);

	const networkInfo = chainId ? NETWORK_INFO[chainId] : null;

	useEffect(() => {
		if (!chainId) {
			setBlockNumber(null);
			return;
		}

		let isMounted = true;
		let intervalId: NodeJS.Timeout | null = null;

		const fetchBlockNumber = async () => {
			try {
				const urls = getRPCUrls(chainId, rpcUrls);
				const client = new RPCClient(urls);
				const result = await client.call<string>("eth_blockNumber", []);
				if (isMounted) {
					setBlockNumber(parseInt(result, 16));
					setIsLoading(false);
				}
			} catch (error) {
				console.error("Failed to fetch block number:", error);
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		setIsLoading(true);
		fetchBlockNumber();

		// Poll for new blocks every 12 seconds (Ethereum average block time)
		intervalId = setInterval(fetchBlockNumber, 12000);

		return () => {
			isMounted = false;
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [chainId, rpcUrls]);

	if (!chainId || !networkInfo) return null;

	return (
		<div
			className={`network-block-indicator ${className || ""}`}
			style={{ borderColor: `${networkInfo.color}40` }}
			title={networkInfo.name}
		>
			<div
				className="network-block-pulse"
				style={{ background: networkInfo.color }}
			/>
			<div className="network-block-logo">
				{networkInfo.logo ? (
					<img src={networkInfo.logo} alt={networkInfo.name} />
				) : (
					<EthereumIcon color={networkInfo.color} />
				)}
			</div>
			<span className="network-block-number">
				{isLoading
					? "..."
					: blockNumber !== null
						? `#${blockNumber.toLocaleString()}`
						: "---"}
			</span>
		</div>
	);
}

export default NetworkBlockIndicator;
