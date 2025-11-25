import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useEffect, useState } from "react";
import { Transaction } from "../../types";
import TransactionDisplay from "../common/TransactionDisplay";
import Loader from "../common/Loader";

export default function Tx() {
	const { chainId, filter } = useParams<{
		chainId?: string;
		filter?: string;
	}>();

	const txHash = filter;
	const numericChainId = Number(chainId) || 1;

	const dataService = useDataService(numericChainId);
	const [transaction, setTransaction] = useState<Transaction | null>(null);
	const [currentBlockNumber, setCurrentBlockNumber] = useState<number | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!dataService || !txHash) {
			setLoading(false);
			return;
		}

		console.log("Fetching transaction:", txHash, "for chain:", numericChainId);
		setLoading(true);
		setError(null);

		Promise.all([
			dataService.getTransaction(txHash),
			dataService.getLatestBlockNumber(),
		])
			.then(([fetchedTransaction, latestBlock]) => {
				console.log("Fetched transaction:", fetchedTransaction);
				console.log("Latest block number:", latestBlock);
				setTransaction(fetchedTransaction);
				setCurrentBlockNumber(latestBlock);
			})
			.catch((err) => {
				console.error("Error fetching transaction:", err);
				setError(err.message || "Failed to fetch transaction");
			})
			.finally(() => setLoading(false));
	}, [dataService, txHash, numericChainId]);

	if (loading) {
		return (
			<div className="container-wide" style={{ padding: "20px" }}>
				<div className="block-display-card">
					<div className="block-display-header">
						<span className="block-label">Transaction</span>
						<span className="tx-mono" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
							{txHash}
						</span>
					</div>
					<div style={{ padding: "48px 24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
						<Loader text="Loading transaction..." />
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container-wide" style={{ padding: "20px" }}>
				<div className="block-display-card">
					<div className="block-display-header">
						<span className="block-label">Transaction</span>
						<span className="tx-mono" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
							{txHash}
						</span>
					</div>
					<div style={{ padding: "24px" }}>
						<p className="error-text" style={{ margin: 0 }}>Error: {error}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container-wide" style={{ padding: "20px" }}>
			{transaction ? (
				<>
					<TransactionDisplay
						transaction={transaction}
						chainId={chainId}
						currentBlockNumber={currentBlockNumber || undefined}
						dataService={dataService}
					/>
				</>
			) : (
				<div className="block-display-card">
					<div className="block-display-header">
						<span className="block-label">Transaction</span>
					</div>
					<div style={{ padding: "24px" }}>
						<p style={{ color: "#9ca3af", margin: 0 }}>Transaction not found</p>
					</div>
				</div>
			)}
		</div>
	);
}
