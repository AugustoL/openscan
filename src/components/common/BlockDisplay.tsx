import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Block, BlockArbitrum } from "../../types";

interface BlockDisplayProps {
	block: Block | BlockArbitrum;
	chainId?: string;
}

const BlockDisplay: React.FC<BlockDisplayProps> = ({ block, chainId }) => {
	const [showWithdrawals, setShowWithdrawals] = useState(false);
	const [showTransactions, setShowTransactions] = useState(false);

	// Check if this is an Arbitrum block
	const isArbitrumBlock = (
		block: Block | BlockArbitrum,
	): block is BlockArbitrum => {
		return "l1BlockNumber" in block;
	};

	// Helper to truncate long hashes
	const truncate = (str: string, start = 6, end = 4) => {
		if (!str) return "";
		if (str.length <= start + end) return str;
		return `${str.slice(0, start)}...${str.slice(-end)}`;
	};

	// Helper to format timestamp
	const formatTime = (timestamp: string) => {
		try {
			// Assuming timestamp is in seconds (standard for ETH)
			const date = new Date(Number(timestamp) * 1000);
			return date.toLocaleString();
		} catch (e) {
			return timestamp;
		}
	};

	return (
		<div className="block-display-card">
			<div className="block-display-header">
				<span className="block-label">Block:</span>
				<span className="block-number">
					{Number(block.number).toLocaleString()}
				</span>
			</div>

			{/* Basic Info */}
			<div className="data-grid-2">
				<div className="info-box">
					<span className="info-box-label">Timestamp</span>
					<span className="info-box-value">{formatTime(block.timestamp)}</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Transactions</span>
					<span className="info-box-value-accent">
						{block.transactions ? block.transactions.length : 0}
					</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Uncles</span>
					<span className="info-box-value">
						{block.uncles ? block.uncles.length : 0}
					</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Size</span>
					<span className="info-box-value">
						{Number(block.size).toLocaleString()} bytes
					</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Nonce</span>
					<span className="info-box-value">
						{Number(block.nonce).toString()}
					</span>
				</div>
			</div>

			{/* Hashes */}
			<div className="data-grid-3">
				<div className="info-box-vertical">
					<span className="info-box-label">Hash</span>
					<span className="info-box-value-mono" title={block.hash}>
						{truncate(block.hash, 10, 8)}
					</span>
				</div>

				<div className="info-box-vertical">
					<span className="info-box-label">Parent Hash</span>
					<span className="info-box-value-mono">
						{chainId &&
						block.parentHash !==
							"0x0000000000000000000000000000000000000000000000000000000000000000" ? (
							<Link
								to={`/${chainId}/block/${Number(block.number) - 1}`}
								className="link-accent"
							>
								{truncate(block.parentHash, 10, 8)}
							</Link>
						) : (
							truncate(block.parentHash, 10, 8)
						)}
					</span>
				</div>

				<div className="info-box-vertical">
					<span className="info-box-label">Miner</span>
					<span className="info-box-value-mono" title={block.miner}>
						{chainId ? (
							<Link
								to={`/${chainId}/address/${block.miner}`}
								className="link-accent"
							>
								{truncate(block.miner)}
							</Link>
						) : (
							truncate(block.miner)
						)}
					</span>
				</div>
			</div>

			{/* Gas Details */}
			<div className="data-grid-2">
				<div className="info-box">
					<span className="info-box-label">Gas Used</span>
					<span className="info-box-value">
						{Number(block.gasUsed).toLocaleString()}
						<span className="gas-percentage">
							(
							{((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(
								1,
							)}
							%)
						</span>
					</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Gas Limit</span>
					<span className="info-box-value">
						{Number(block.gasLimit).toLocaleString()}
					</span>
				</div>
			</div>

			{/* Difficulty */}
			<div className="data-grid-2">
				<div className="info-box">
					<span className="info-box-label">Difficulty</span>
					<span className="info-box-value">
						{Number(block.difficulty).toLocaleString()}
					</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Total Difficulty</span>
					<span className="info-box-value">
						{Number(block.totalDifficulty).toLocaleString()}
					</span>
				</div>
			</div>

			{/* Merkle Roots */}
			<div
				className="data-grid-3"
				style={{
					marginBottom:
						block.extraData && block.extraData !== "0x" ? "16px" : "0",
				}}
			>
				<div className="info-box-vertical">
					<span className="info-box-label">State Root</span>
					<span className="info-box-value-mono" title={block.stateRoot}>
						{truncate(block.stateRoot, 10, 8)}
					</span>
				</div>

				<div className="info-box-vertical">
					<span className="info-box-label">Transactions Root</span>
					<span className="info-box-value-mono" title={block.transactionsRoot}>
						{truncate(block.transactionsRoot, 10, 8)}
					</span>
				</div>

				<div className="info-box-vertical">
					<span className="info-box-label">Receipts Root</span>
					<span className="info-box-value-mono" title={block.receiptsRoot}>
						{truncate(block.receiptsRoot, 10, 8)}
					</span>
				</div>
			</div>

			{/* Extra Data */}
			{block.extraData && block.extraData !== "0x" && (
				<div className="info-box-vertical">
					<span className="info-box-label">Extra Data</span>
					<span className="info-box-value-mono" title={block.extraData}>
						{block.extraData.length > 20
							? truncate(block.extraData, 10, 8)
							: block.extraData}
					</span>
				</div>
			)}

			{/* Arbitrum-specific fields */}
			{isArbitrumBlock(block) && (
				<div
					className="data-grid-2"
					style={{ marginTop: "16px", marginBottom: "16px" }}
				>
					<div className="info-box-arbitrum">
						<span className="info-box-arbitrum-label">L1 Block Number</span>
						<span className="info-box-value">
							{Number(block.l1BlockNumber).toLocaleString()}
						</span>
					</div>

					<div className="info-box-arbitrum">
						<span className="info-box-arbitrum-label">Send Count</span>
						<span className="info-box-value">{block.sendCount}</span>
					</div>

					<div
						className="info-box-arbitrum-vertical"
						style={{ gridColumn: "1 / -1" }}
					>
						<span className="info-box-arbitrum-label">Send Root</span>
						<span className="info-box-value-mono">{block.sendRoot}</span>
					</div>
				</div>
			)}

			{/* Transactions */}
			{block.transactions && block.transactions.length > 0 && (
				<div className="mt-medium">
					<button
						onClick={() => setShowTransactions(!showTransactions)}
						className="collapsible-button"
					>
						{showTransactions ? "Hide" : "Show"} Transactions (
						{block.transactions.length})
					</button>

					{showTransactions && (
						<div className="collapsible-content">
							{block.transactions.map((txHash, index) => (
								<div key={index} className="list-item">
									<div className="list-item-index">Tx {index}</div>
									{chainId ? (
										<Link
											to={`/${chainId}/tx/${txHash}`}
											className="list-item-hash link-accent"
										>
											{txHash}
										</Link>
									) : (
										<span className="list-item-hash">{txHash}</span>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Withdrawals */}
			{block.withdrawals && block.withdrawals.length > 0 && (
				<div className="mt-medium">
					<button
						onClick={() => setShowWithdrawals(!showWithdrawals)}
						className="collapsible-button"
					>
						{showWithdrawals ? "Hide" : "Show"} Withdrawals (
						{block.withdrawals.length})
					</button>

					{showWithdrawals && (
						<div className="collapsible-content">
							{block.withdrawals.map((withdrawal, index) => (
								<div key={index} className="withdrawal-item">
									<div className="withdrawal-header">Withdrawal {index}</div>
									<div className="withdrawal-details">
										<div>
											<span className="info-box-label">Index: </span>
											<span className="info-box-value">
												{Number(withdrawal.index).toLocaleString()}
											</span>
										</div>
										<div>
											<span className="info-box-label">Validator Index: </span>
											<span className="info-box-value">
												{Number(withdrawal.validatorIndex).toLocaleString()}
											</span>
										</div>
										<div>
											<span className="info-box-label">Amount: </span>
											<span className="info-box-value-accent">
												{(Number(withdrawal.amount) / 1e9).toFixed(9)} ETH
											</span>
										</div>
										<div style={{ gridColumn: "1 / -1" }}>
											<span className="info-box-label">Address: </span>
											{chainId ? (
												<Link
													to={`/${chainId}/address/${withdrawal.address}`}
													className="link-accent"
												>
													{withdrawal.address}
												</Link>
											) : (
												<span className="info-box-value-mono">
													{withdrawal.address}
												</span>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default BlockDisplay;
