import React from "react";
import { NetworkStats } from "../../types";

interface NetworkStatsDisplayProps {
	networkStats: NetworkStats | null;
	loading?: boolean;
	error?: string | null;
	chainId?: number;
}

const NetworkStatsDisplay: React.FC<NetworkStatsDisplayProps> = ({
	networkStats,
	loading = false,
	error = null,
	chainId,
}) => {
	if (loading) {
		return (
			<div
				className="container-wide"
				style={{ margin: "40px auto 0", padding: "0 24px" }}
			>
				<div className="block-display-card">
					<div
						className="text-center"
						style={{ padding: "20px", color: "#10b981" }}
					>
						Loading network statistics...
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div
				className="container-wide"
				style={{ margin: "40px auto 0", padding: "0 24px" }}
			>
				<div className="block-display-card">
					<div
						className="text-center"
						style={{ padding: "20px", color: "#ef4444" }}
					>
						Error loading network stats: {error}
					</div>
				</div>
			</div>
		);
	}

	if (!networkStats) {
		return null;
	}

	// Format gas price from Wei to Gwei
	const formatGasPrice = (weiPrice: string): string => {
		try {
			const gwei = Number(weiPrice) / 1e9;
			return `${gwei.toFixed(2)} Gwei`;
		} catch {
			return weiPrice;
		}
	};

	// Format block number with commas
	const formatBlockNumber = (blockNumber: string): string => {
		try {
			return Number(blockNumber).toLocaleString();
		} catch {
			return blockNumber;
		}
	};

	// Parse protocol version from metadata (localhost/Hardhat only)
	const getProtocolVersion = (): string | null => {
		if (chainId !== 31337 || !networkStats.metadata) {
			return null;
		}

		try {
			return networkStats.metadata.clientVersion || null;
		} catch (err) {
			console.error("Failed to parse metadata:", err);
			return null;
		}
	};

	// Get forked network info (localhost/Hardhat only)
	const getForkedNetworkInfo = (): {
		chainId: number;
		blockNumber: number;
		blockHash: string;
	} | null => {
		if (
			chainId !== 31337 ||
			!networkStats.metadata ||
			!networkStats.metadata.forkedNetwork
		) {
			return null;
		}

		try {
			const forked = networkStats.metadata.forkedNetwork;
			return {
				chainId: forked.chainId,
				blockNumber: forked.forkBlockNumber,
				blockHash: forked.forkBlockHash,
			};
		} catch (err) {
			console.error("Failed to parse forked network info:", err);
			return null;
		}
	};

	const protocolVersion = getProtocolVersion();
	const forkedNetwork = getForkedNetworkInfo();

	return (
		<div
			className="container-wide"
			style={{ margin: "40px auto 0", padding: "0 24px" }}
		>
			<div className="block-display-card">
				<h2
					style={{
						fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
						fontWeight: "600",
						color: "#10b981",
						marginBottom: "20px",
						fontFamily: "'Outfit', sans-serif",
						textTransform: "uppercase",
						letterSpacing: "0.5px",
					}}
				>
					Network Statistics
				</h2>

				<div className="data-grid-3">
					<div className="block-detail-item">
						<span className="detail-label">Current Gas Price</span>
						<span className="detail-value">
							{formatGasPrice(networkStats.currentGasPrice)}
						</span>
					</div>

					<div className="block-detail-item">
						<span className="detail-label">Current Block Number</span>
						<span className="detail-value">
							{formatBlockNumber(networkStats.currentBlockNumber)}
						</span>
					</div>

					<div className="block-detail-item">
						<span className="detail-label">Sync Status</span>
						<span className="detail-value">
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: "8px",
								}}
							>
								<span
									style={{
										width: "10px",
										height: "10px",
										borderRadius: "50%",
										backgroundColor: networkStats.isSyncing
											? "#f59e0b"
											: "#10b981",
										display: "inline-block",
									}}
								/>
								{networkStats.isSyncing ? "Syncing" : "Synced"}
							</span>
						</span>
					</div>

					{protocolVersion && (
						<div className="block-detail-item">
							<span className="detail-label">Protocol Version</span>
							<span className="detail-value">{protocolVersion}</span>
						</div>
					)}

					{forkedNetwork && (
						<>
							<div className="block-detail-item">
								<span className="detail-label">Forked Network</span>
								<span className="detail-value">
									Chain ID: {forkedNetwork.chainId}
								</span>
							</div>

							<div className="block-detail-item">
								<span className="detail-label">Fork Block Number</span>
								<span className="detail-value">
									{formatBlockNumber(forkedNetwork.blockNumber.toString())}
								</span>
							</div>

							<div
								className="block-detail-item"
								style={{ gridColumn: "1 / -1" }}
							>
								<span className="detail-label">Fork Block Hash</span>
								<span
									className="detail-value"
									style={{
										fontFamily: "monospace",
										fontSize: "0.85rem",
										wordBreak: "break-all",
									}}
								>
									{forkedNetwork.blockHash}
								</span>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default NetworkStatsDisplay;
