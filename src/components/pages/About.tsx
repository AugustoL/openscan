import React from "react";

const About: React.FC = () => {
	const appVersion = process.env.REACT_APP_VERSION || "0.1.0";
	const commitHash = process.env.REACT_APP_COMMIT_HASH || "development";
	const formattedCommitHash =
		commitHash.length > 7 ? commitHash.substring(0, 7) : commitHash;

	return (
		<div className="container-medium page-container-padded">
			{/* Header */}
			<div className="text-center mb-large">
				<h1 className="page-heading">About OpenScan</h1>
				<p className="page-subtitle">
					An open-source, lightweight, multi-chain blockchain explorer
				</p>
			</div>

			{/* Version Info Card */}
			<div className="version-card">
				<div className="version-card-grid">
					<div className="version-info-item">
						<div className="version-info-label">Version</div>
						<div className="version-info-value">{appVersion}</div>
					</div>
					<div className="version-info-item">
						<div className="version-info-label">Commit</div>
						<div className="version-info-value-mono">{formattedCommitHash}</div>
					</div>
				</div>
			</div>

			{/* Features Grid */}
			<h2 className="page-heading-large text-center">Features</h2>

			<div className="data-grid-3 mb-large">
				{[
					{
						title: "🌐 Multi-Chain Support",
						description:
							"Explore Ethereum Mainnet, Sepolia, Arbitrum One, Optimism, and local development networks.",
					},
					{
						title: "🔍 Block Explorer",
						description:
							"View detailed information about blocks, transactions, and addresses across all supported chains.",
					},
					{
						title: "✅ Contract Verification",
						description:
							"Integration with Sourcify API to display verified contract source code, ABI, and metadata.",
					},
					{
						title: "📊 Real-Time Data",
						description:
							"Live network statistics, gas prices, and mempool monitoring for supported chains.",
					},
					{
						title: "🎨 Modern UI",
						description:
							"Clean, responsive interface with dark theme optimized for blockchain data visualization.",
					},
					{
						title: "⚡ Fast Performance",
						description:
							"Efficient caching and lazy loading for quick data access and smooth user experience.",
					},
				].map((feature, index) => (
					<div key={index} className="feature-card">
						<h3 className="feature-card-title">{feature.title}</h3>
						<p className="feature-card-description">{feature.description}</p>
					</div>
				))}
			</div>

			{/* Supported Networks */}
			<h2 className="page-heading-large text-center">Supported Networks</h2>

			<div className="data-grid-3 mb-large">
				{[
					{ name: "Ethereum Mainnet", chainId: "1", icon: "⟠" },
					{ name: "Sepolia Testnet", chainId: "11155111", icon: "🧪" },
					{ name: "Arbitrum One", chainId: "42161", icon: "🔷" },
					{ name: "Optimism", chainId: "10", icon: "🔴" },
					{ name: "Localhost", chainId: "31337", icon: "💻" },
				].map((network, index) => (
					<div key={index} className="network-item">
						<div className="network-icon-box">{network.icon}</div>
						<div className="network-info">
							<div className="network-name">{network.name}</div>
							<div className="network-chain-id">
								Chain ID: {network.chainId}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Open Source */}
			<div className="text-center mb-large opensource-card">
				<h2 className="opensource-title">Open Source</h2>
				<p className="opensource-description">
					OpenScan is free and open source software. Contributions, issues, and
					feature requests are welcome!
				</p>
				<a
					href="https://github.com/AugustoL/openscan"
					target="_blank"
					rel="noopener noreferrer"
					className="button-primary-inline"
				>
					View on GitHub ↗
				</a>
			</div>

			{/* License */}
			<div className="text-center license-footer">
				<p>OpenScan is licensed under the MIT License</p>
				<p className="license-footer-spacing">
					Built with ❤️ for the Ethereum community
				</p>
			</div>
		</div>
	);
};

export default About;
