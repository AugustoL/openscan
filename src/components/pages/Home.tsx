import { Link } from "react-router-dom";
import { useState } from "react";
import arbitrumLogo from "../../assets/arbitrum-logo.svg";
import optimismLogo from "../../assets/optimism-logo.svg";
import baseLogo from "../../assets/base-logo.svg";
import hardhatLogo from "../../assets/hardhat-logo.svg";

interface NetworkCardProps {
	to: string;
	name: string;
	description: string;
	icon: React.ReactNode;
	color: string;
	chainId: string;
	centered?: boolean;
}

const NetworkCard: React.FC<NetworkCardProps> = ({
	to,
	name,
	description,
	icon,
	color,
	chainId,
	centered = false,
}) => {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Link
			to={to}
			className="network-card-link"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div
				className="network-card"
				style={{
					border: `2px solid ${isHovered ? color : "rgba(255, 255, 255, 0.1)"}`,
					transform: isHovered ? "translateY(-4px)" : "translateY(0)",
					boxShadow: isHovered
						? `0 8px 32px ${color}40`
						: "0 4px 16px rgba(0, 0, 0, 0.2)",
				}}
			>
				<div
					className={
						centered ? "network-card-header-centered" : "network-card-header"
					}
				>
					<div
						className="network-card-icon"
						style={{
							background: `${color}20`,
						}}
					>
						{icon}
					</div>
					<div
						className="network-card-info"
						style={{ flex: centered ? "0" : "1" }}
					>
						<h3 className="network-card-title">{name}</h3>
						<div className="network-card-chain-id">Chain ID: {chainId}</div>
					</div>
				</div>
				<p className="network-card-description">{description}</p>
			</div>
		</Link>
	);
};

export default function Home() {
	const mainNetworks = [
		{
			to: "/1",
			name: "Ethereum Mainnet",
			description: "The main Ethereum network",
			chainId: "1",
			color: "#627EEA",
			icon: (
				<svg
					width="32"
					height="32"
					viewBox="0 0 256 417"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="#627EEA"
						d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"
					/>
					<path
						fill="#8C97C2"
						d="M127.962 0 0 212.32l127.962 75.639V154.158z"
					/>
					<path
						fill="#627EEA"
						d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z"
					/>
					<path fill="#8C97C2" d="M127.962 416.905v-104.72L0 236.585z" />
					<path
						fill="#C1CCF7"
						d="m127.961 287.958 127.96-75.637-127.96-58.162z"
					/>
					<path fill="#8C97C2" d="m.001 212.321 127.96 75.637V154.159z" />
				</svg>
			),
		},
		{
			to: "/42161",
			name: "Arbitrum One",
			description: "Ethereum Layer 2 scaling solution",
			chainId: "42161",
			color: "#28A0F0",
			icon: <img src={arbitrumLogo} alt="Arbitrum" width="32" height="32" />,
		},
		{
			to: "/10",
			name: "Optimism",
			description: "Ethereum Layer 2 with low fees",
			chainId: "10",
			color: "#FF0420",
			icon: <img src={optimismLogo} alt="Optimism" width="32" height="32" />,
		},
		{
			to: "/8453",
			name: "Base",
			description: "Coinbase's Ethereum Layer 2",
			chainId: "8453",
			color: "#0052FF",
			icon: <img src={baseLogo} alt="Base" width="32" height="32" />,
		},
		{
			to: "/56",
			name: "BSC",
			description: "Binance Smart Chain mainnet",
			chainId: "56",
			color: "#F0B90B",
			icon: (
				<svg
					width="32"
					height="32"
					viewBox="0 0 126.61 126.61"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="#F0B90B"
						d="m38.73 53.2 24.59-24.58 24.6 24.6 14.3-14.31L63.32 0l-38.9 38.9zM0 63.31l14.3-14.31 14.31 14.31-14.31 14.3zM38.73 73.41l24.59 24.59 24.6-24.6 14.31 14.29-38.9 38.91-38.91-38.88zM97.99 63.31l14.3-14.31 14.32 14.31-14.31 14.3z"
					/>
					<path
						fill="#F0B90B"
						d="m77.83 63.3-14.51-14.52-10.73 10.73-1.24 1.23-2.54 2.54 14.51 14.5 14.51-14.47z"
					/>
				</svg>
			),
		},
		{
			to: "/97",
			name: "BSC Testnet",
			description: "Binance Smart Chain testnet",
			chainId: "97",
			color: "#F0B90B",
			icon: (
				<svg
					width="32"
					height="32"
					viewBox="0 0 126.61 126.61"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="#F0B90B"
						fillOpacity="0.7"
						d="m38.73 53.2 24.59-24.58 24.6 24.6 14.3-14.31L63.32 0l-38.9 38.9zM0 63.31l14.3-14.31 14.31 14.31-14.31 14.3zM38.73 73.41l24.59 24.59 24.6-24.6 14.31 14.29-38.9 38.91-38.91-38.88zM97.99 63.31l14.3-14.31 14.32 14.31-14.31 14.3z"
					/>
					<path
						fill="#F0B90B"
						fillOpacity="0.7"
						d="m77.83 63.3-14.51-14.52-10.73 10.73-1.24 1.23-2.54 2.54 14.51 14.5 14.51-14.47z"
					/>
				</svg>
			),
		},
		{
			to: "/137",
			name: "Polygon",
			description: "Polygon POS mainnet",
			chainId: "137",
			color: "#8247E5",
			icon: (
				<svg
					width="32"
					height="32"
					viewBox="0 0 38 33"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="#8247E5"
						d="M29 10.2c-.7-.4-1.6-.4-2.4 0L21 13.5l-3.8 2.1-5.5 3.3c-.7.4-1.6.4-2.4 0L5 16.3c-.7-.4-1.2-1.2-1.2-2.1v-5c0-.8.4-1.6 1.2-2.1l4.3-2.5c.7-.4 1.6-.4 2.4 0L16 7.2c.7.4 1.2 1.2 1.2 2.1v3.3l3.8-2.2V7c0-.8-.4-1.6-1.2-2.1l-8-4.7c-.7-.4-1.6-.4-2.4 0L1.2 5C.4 5.4 0 6.2 0 7v9.4c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.4 0l5.5-3.2 3.8-2.2 5.5-3.2c.7-.4 1.6-.4 2.4 0l4.3 2.5c.7.4 1.2 1.2 1.2 2.1v5c0 .8-.4 1.6-1.2 2.1L29 29.5c-.7.4-1.6.4-2.4 0l-4.3-2.5c-.7-.4-1.2-1.2-1.2-2.1v-3.2l-3.8 2.2v3.3c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.4 0l8.1-4.7c.7-.4 1.2-1.2 1.2-2.1V18c0-.8-.4-1.6-1.2-2.1L29 10.2z"
					/>
				</svg>
			),
		},
		{
			to: "/31337",
			name: "Localhost",
			description: "Local development network, hardhat or anvil",
			chainId: "31337",
			color: "#FFF100",
			icon: <img src={hardhatLogo} alt="Localhost" width="32" height="32" />,
		},
		{
			to: "/11155111",
			name: "Sepolia Testnet",
			description: "Ethereum test network for development",
			chainId: "11155111",
			color: "#F0CDC2",
			icon: (
				<svg
					width="32"
					height="32"
					viewBox="0 0 256 417"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="#F0CDC2"
						d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"
					/>
					<path
						fill="#D4A59A"
						d="M127.962 0 0 212.32l127.962 75.639V154.158z"
					/>
					<path
						fill="#F0CDC2"
						d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z"
					/>
					<path fill="#D4A59A" d="M127.962 416.905v-104.72L0 236.585z" />
					<path
						fill="#F5E5DE"
						d="m127.961 287.958 127.96-75.637-127.96-58.162z"
					/>
					<path fill="#D4A59A" d="m.001 212.321 127.96 75.637V154.159z" />
				</svg>
			),
		},
	];

	return (
		<div className="home-container">
			<div className="home-content page-card">
				<h1 className="home-title">OPENSCAN</h1>
				<p className="subtitle">Select a blockchain network to explore</p>

				<div className="network-grid">
					{mainNetworks.map((network) => (
						<NetworkCard key={network.chainId} {...network} />
					))}
				</div>
			</div>
		</div>
	);
}
