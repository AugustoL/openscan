import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	Transaction,
	TransactionArbitrum,
	TransactionReceiptArbitrum,
	TransactionReceiptOptimism,
} from "../../types";
import LongString from "./LongString";
import { DataService } from "../../services/DataService";
import { TraceResult } from "../../services/EVM/L1/fetchers/trace";

interface TransactionDisplayProps {
	transaction: Transaction | TransactionArbitrum;
	chainId?: string;
	currentBlockNumber?: number;
	dataService?: DataService;
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({
	transaction,
	chainId,
	currentBlockNumber,
	dataService,
}) => {
	const [showRawData, setShowRawData] = useState(false);
	const [showLogs, setShowLogs] = useState(false);
	const [showTrace, setShowTrace] = useState(false);
	const [traceData, setTraceData] = useState<TraceResult | null>(null);
	const [callTrace, setCallTrace] = useState<any>(null);
	const [loadingTrace, setLoadingTrace] = useState(false);

	// Check if trace is available (localhost only)
	const isTraceAvailable = dataService?.isTraceAvailable() || false;

	// Load trace data when trace section is expanded
	useEffect(() => {
		if (
			showTrace &&
			isTraceAvailable &&
			dataService &&
			!traceData &&
			!callTrace
		) {
			setLoadingTrace(true);
			Promise.all([
				dataService.getTransactionTrace(transaction.hash),
				dataService.getCallTrace(transaction.hash),
			])
				.then(([trace, call]) => {
					setTraceData(trace);
					setCallTrace(call);
				})
				.catch((err) => console.error("Error loading trace:", err))
				.finally(() => setLoadingTrace(false));
		}
	}, [
		showTrace,
		isTraceAvailable,
		dataService,
		transaction.hash,
		traceData,
		callTrace,
	]);

	// Check if this is an Arbitrum transaction
	const isArbitrumTx = (
		tx: Transaction | TransactionArbitrum,
	): tx is TransactionArbitrum => {
		return "requestId" in tx;
	};

	// Check if receipt is Arbitrum receipt
	const isArbitrumReceipt = (
		receipt: any,
	): receipt is TransactionReceiptArbitrum => {
		return receipt && "l1BlockNumber" in receipt;
	};

	// Check if receipt is Optimism receipt
	const isOptimismReceipt = (
		receipt: any,
	): receipt is TransactionReceiptOptimism => {
		return receipt && "l1Fee" in receipt;
	};

	const truncate = (str: string, start = 6, end = 4) => {
		if (!str) return "";
		if (str.length <= start + end) return str;
		return `${str.slice(0, start)}...${str.slice(-end)}`;
	};

	const formatValue = (value: string) => {
		try {
			const eth = Number(value) / 1e18;
			return `${eth.toFixed(6)} ETH`;
		} catch (e) {
			return value;
		}
	};

	const formatGwei = (value: string) => {
		try {
			const gwei = Number(value) / 1e9;
			return `${gwei.toFixed(2)} Gwei`;
		} catch (e) {
			return value;
		}
	};

	const getStatusBadge = (status?: string) => {
		if (!status) return null;
		const isSuccess = status === "0x1" || status === "1";
		return (
			<span
				className={`status-badge ${isSuccess ? "status-badge-success" : "status-badge-failed"}`}
			>
				{isSuccess ? "Success" : "Failed"}
			</span>
		);
	};

	return (
		<div className="block-display-card">
			<div className="block-display-header">
				<span className="block-label">Transaction:</span>
				<span className="block-number">
					<LongString value={transaction.hash} start={10} end={8} />
				</span>
			</div>

			{/* Basic Transaction Info */}
			<div className="data-grid-2 mb-medium">
				<div className="info-box">
					<span className="info-box-label">Status</span>
					<span>{getStatusBadge(transaction.receipt?.status)}</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Block</span>
					<span className="info-box-value">
						{Number(transaction.blockNumber).toLocaleString()}
					</span>
				</div>

				{currentBlockNumber && (
					<div className="info-box">
						<span className="info-box-label">Confirmations</span>
						<span className="info-box-value">
							{(() => {
								const confirmations =
									currentBlockNumber - Number(transaction.blockNumber);
								return confirmations > 100
									? "+100"
									: confirmations.toLocaleString();
							})()}
						</span>
					</div>
				)}

				<div className="info-box">
					<span className="info-box-label">Nonce</span>
					<span className="info-box-value">{transaction.nonce}</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Index</span>
					<span className="info-box-value">{transaction.transactionIndex}</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Type</span>
					<span className="info-box-value">{transaction.type}</span>
				</div>
			</div>

			{/* Addresses */}
			<div className="data-grid-3 mb-medium">
				<div className="info-box-vertical">
					<span className="info-box-label">From</span>
					<span className="info-box-value-mono">
						{chainId ? (
							<Link
								to={`/${chainId}/address/${transaction.from}`}
								className="link-accent"
							>
								{truncate(transaction.from, 10, 8)}
							</Link>
						) : (
							truncate(transaction.from, 10, 8)
						)}
					</span>
				</div>

				<div className="info-box-vertical">
					<span className="info-box-label">To</span>
					<span className="info-box-value-mono">
						{transaction.to ? (
							chainId ? (
								<Link
									to={`/${chainId}/address/${transaction.to}`}
									className="link-accent"
								>
									{truncate(transaction.to, 10, 8)}
								</Link>
							) : (
								truncate(transaction.to, 10, 8)
							)
						) : (
							<span className="contract-creation-label">Contract Creation</span>
						)}
					</span>
				</div>

				{transaction.receipt?.contractAddress && (
					<div className="info-box-vertical">
						<span className="info-box-label">Contract Address</span>
						<span className="info-box-value-mono">
							{chainId ? (
								<Link
									to={`/${chainId}/address/${transaction.receipt.contractAddress}`}
									className="link-accent"
								>
									{truncate(transaction.receipt.contractAddress, 10, 8)}
								</Link>
							) : (
								truncate(transaction.receipt.contractAddress, 10, 8)
							)}
						</span>
					</div>
				)}
			</div>

			{/* Value and Fees */}
			<div className="data-grid-2 mb-medium">
				<div className="info-box">
					<span className="info-box-label">Value</span>
					<span className="info-box-value-accent">
						{formatValue(transaction.value)}
					</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Transaction Fee</span>
					<span className="info-box-value">
						{transaction.receipt
							? formatValue(
									(
										BigInt(transaction.receipt.gasUsed) *
										BigInt(transaction.receipt.effectiveGasPrice)
									).toString(),
								)
							: "N/A"}
					</span>
				</div>
			</div>

			{/* Gas Details */}
			<div className="data-grid-2 mb-medium">
				<div className="info-box">
					<span className="info-box-label">Gas Price</span>
					<span className="info-box-value">
						{formatGwei(transaction.gasPrice)}
					</span>
				</div>

				<div className="info-box">
					<span className="info-box-label">Gas Limit</span>
					<span className="info-box-value">
						{Number(transaction.gas).toLocaleString()}
					</span>
				</div>

				{transaction.receipt && (
					<>
						<div className="info-box">
							<span className="info-box-label">Gas Used</span>
							<span className="info-box-value">
								{Number(transaction.receipt.gasUsed).toLocaleString()}
								<span className="gas-percentage">
									(
									{(
										(Number(transaction.receipt.gasUsed) /
											Number(transaction.gas)) *
										100
									).toFixed(1)}
									%)
								</span>
							</span>
						</div>

						<div className="info-box">
							<span className="info-box-label">Effective Gas Price</span>
							<span className="info-box-value">
								{formatGwei(transaction.receipt.effectiveGasPrice)}
							</span>
						</div>
					</>
				)}
			</div>

			{/* Arbitrum-specific fields */}
			{isArbitrumTx(transaction) && (
				<div className="arbitrum-grid">
					{transaction.requestId && transaction.requestId !== "0x0" && (
						<div className="info-box-arbitrum-vertical">
							<span className="info-box-arbitrum-label">Request ID</span>
							<span className="info-box-value-mono">
								{transaction.requestId}
							</span>
						</div>
					)}

					{transaction.receipt && isArbitrumReceipt(transaction.receipt) && (
						<>
							<div className="info-box-arbitrum">
								<span className="info-box-arbitrum-label">L1 Block Number</span>
								<span className="info-box-value">
									{Number(transaction.receipt.l1BlockNumber).toLocaleString()}
								</span>
							</div>

							<div className="info-box-arbitrum">
								<span className="info-box-arbitrum-label">Gas Used for L1</span>
								<span className="info-box-value">
									{Number(transaction.receipt.gasUsedForL1).toLocaleString()}
								</span>
							</div>
						</>
					)}
				</div>
			)}

			{/* Optimism-specific fields */}
			{transaction.receipt && isOptimismReceipt(transaction.receipt) && (
				<div className="optimism-grid">
					<div className="info-box-optimism">
						<span className="info-box-optimism-label">L1 Fee</span>
						<span className="info-box-value">
							{formatValue(transaction.receipt.l1Fee)}
						</span>
					</div>

					<div className="info-box-optimism">
						<span className="info-box-optimism-label">L1 Gas Price</span>
						<span className="info-box-value">
							{formatGwei(transaction.receipt.l1GasPrice)}
						</span>
					</div>

					<div className="info-box-optimism">
						<span className="info-box-optimism-label">L1 Gas Used</span>
						<span className="info-box-value">
							{Number(transaction.receipt.l1GasUsed).toLocaleString()}
						</span>
					</div>

					<div className="info-box-optimism">
						<span className="info-box-optimism-label">L1 Fee Scalar</span>
						<span className="info-box-value">
							{transaction.receipt.l1FeeScalar}
						</span>
					</div>
				</div>
			)}

			{/* Input Data Section */}
			{transaction.data && transaction.data !== "0x" && (
				<div className="collapsible-container">
					<button
						className="collapsible-button"
						onClick={() => setShowRawData(!showRawData)}
					>
						{showRawData ? "Hide" : "Show"} Input Data
					</button>

					{showRawData && (
						<div className="input-data-display">{transaction.data}</div>
					)}
				</div>
			)}

			{/* Event Logs Section */}
			{transaction.receipt && transaction.receipt.logs.length > 0 && (
				<div className="collapsible-container">
					<button
						className="collapsible-button"
						onClick={() => setShowLogs(!showLogs)}
					>
						{showLogs ? "Hide" : "Show"} Event Logs (
						{transaction.receipt.logs.length})
					</button>

					{showLogs && (
						<div className="collapsible-content">
							{transaction.receipt.logs.map((log: any, index: number) => (
								<div key={index} className="log-container">
									<div className="log-header">Log {index}</div>
									<div className="log-details">
										<div>
											<span className="log-label">Address: </span>
											{chainId ? (
												<Link
													to={`/${chainId}/address/${log.address}`}
													className="link-accent log-value"
												>
													{log.address}
												</Link>
											) : (
												<span className="log-value">{log.address}</span>
											)}
										</div>
										{log.topics && log.topics.length > 0 && (
											<div>
												<span className="log-label">Topics:</span>
												{log.topics.map((topic: string, i: number) => (
													<div key={i} className="log-topic-item">
														[{i}]{" "}
														<LongString value={topic} start={10} end={8} />
													</div>
												))}
											</div>
										)}
										{log.data && log.data !== "0x" && (
											<div>
												<span className="log-label">Data: </span>
												<div className="log-value" style={{ marginTop: "4px" }}>
													<LongString value={log.data} start={20} end={20} />
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Debug Trace Section (Localhost Only) */}
			{isTraceAvailable && (
				<div className="collapsible-container">
					<button
						className="collapsible-button-purple"
						onClick={() => setShowTrace(!showTrace)}
					>
						{showTrace ? "Hide" : "Show"} Debug Trace
					</button>

					{showTrace && (
						<div className="collapsible-content">
							{loadingTrace && (
								<div className="trace-loading">Loading trace data...</div>
							)}

							{/* Call Trace */}
							{callTrace && (
								<div className="trace-container">
									<div className="trace-title">Call Trace</div>
									<div className="trace-details">
										<div>
											<span className="log-label">Type:</span> {callTrace.type}
										</div>
										<div>
											<span className="log-label">From:</span>{" "}
											<LongString value={callTrace.from} start={10} end={8} />
										</div>
										<div>
											<span className="log-label">To:</span>{" "}
											<LongString value={callTrace.to} start={10} end={8} />
										</div>
										<div>
											<span className="log-label">Value:</span>{" "}
											{callTrace.value}
										</div>
										<div>
											<span className="log-label">Gas:</span> {callTrace.gas}
										</div>
										<div>
											<span className="log-label">Gas Used:</span>{" "}
											{callTrace.gasUsed}
										</div>
										{callTrace.error && (
											<div className="trace-error">
												<span className="log-label">Error:</span>{" "}
												{callTrace.error}
											</div>
										)}
										{callTrace.calls && callTrace.calls.length > 0 && (
											<div style={{ marginTop: "10px" }}>
												<div className="trace-calls-header">
													Internal Calls ({callTrace.calls.length}):
												</div>
												<div className="trace-calls-container">
													{JSON.stringify(callTrace.calls, null, 2)}
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Opcode Trace */}
							{traceData && (
								<div className="trace-container">
									<div className="trace-title">Execution Trace</div>
									<div
										className="trace-details"
										style={{ marginBottom: "15px" }}
									>
										<div>
											<span className="log-label">Total Gas Used:</span>{" "}
											{traceData.gas}
										</div>
										<div>
											<span className="log-label">Failed:</span>{" "}
											{traceData.failed ? "Yes" : "No"}
										</div>
										<div>
											<span className="log-label">Return Value:</span>{" "}
											<LongString
												value={traceData.returnValue || "0x"}
												start={20}
												end={20}
											/>
										</div>
										<div>
											<span className="log-label">Opcodes Executed:</span>{" "}
											{traceData.structLogs.length}
										</div>
									</div>

									<div className="trace-opcode-header">
										Opcode Execution Log:
									</div>
									<div className="trace-opcode-container">
										{traceData.structLogs.slice(0, 100).map((log, index) => (
											<div key={index} className="trace-opcode-step">
												<div className="trace-opcode-name">
													Step {index}: {log.op}
												</div>
												<div className="trace-opcode-info">
													PC: {log.pc} | Gas: {log.gas} | Cost: {log.gasCost} |
													Depth: {log.depth}
												</div>
												{log.stack && log.stack.length > 0 && (
													<div className="trace-opcode-stack">
														Stack: [{log.stack.slice(0, 3).join(", ")}
														{log.stack.length > 3 ? "..." : ""}]
													</div>
												)}
											</div>
										))}
										{traceData.structLogs.length > 100 && (
											<div className="trace-more-text">
												... showing first 100 of {traceData.structLogs.length}{" "}
												steps
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default TransactionDisplay;
