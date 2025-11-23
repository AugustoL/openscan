import React from "react";
import { TransactionReceipt } from "../../types";

interface TransactionReceiptDisplayProps {
	receipt: TransactionReceipt;
}

const TransactionReceiptDisplay: React.FC<TransactionReceiptDisplayProps> = ({
	receipt,
}) => {
	const truncate = (str: string, start = 6, end = 4) => {
		if (!str) return "";
		if (str.length <= start + end) return str;
		return `${str.slice(0, start)}...${str.slice(-end)}`;
	};

	const getStatusText = (status: string) => {
		return status === "1" || status === "0x1" ? "Success" : "Failed";
	};

	return (
		<div className="block-display-card">
			<div className="block-display-header">
				<span className="block-label">Receipt:</span>
				<span className="block-number">
					{truncate(receipt.transactionHash, 8, 6)}
				</span>
			</div>

			<div className="block-display-grid">
				<div className="block-detail-item">
					<span className="detail-label">Status</span>
					<span className="detail-value">{getStatusText(receipt.status)}</span>
				</div>

				<div className="block-detail-item">
					<span className="detail-label">Block Number</span>
					<span className="detail-value">{receipt.blockNumber}</span>
				</div>

				<div className="block-detail-item">
					<span className="detail-label">From</span>
					<span className="detail-value" title={receipt.from}>
						{truncate(receipt.from)}
					</span>
				</div>

				<div className="block-detail-item">
					<span className="detail-label">To</span>
					<span className="detail-value" title={receipt.to}>
						{truncate(receipt.to)}
					</span>
				</div>

				<div className="block-detail-item">
					<span className="detail-label">Gas Used</span>
					<span className="detail-value">
						{Number(receipt.gasUsed).toLocaleString()}
					</span>
				</div>

				<div className="block-detail-item">
					<span className="detail-label">Cumulative Gas Used</span>
					<span className="detail-value">
						{Number(receipt.cumulativeGasUsed).toLocaleString()}
					</span>
				</div>

				<div className="block-detail-item">
					<span className="detail-label">Contract Address</span>
					<span className="detail-value">
						{receipt.contractAddress || "N/A"}
					</span>
				</div>
			</div>
		</div>
	);
};

export default TransactionReceiptDisplay;
