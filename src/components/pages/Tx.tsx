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
			<div className="container-wide page-container-padded text-center">
				<h1 className="page-title-small">Transaction</h1>
				<Loader text="Loading transaction..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="container-wide page-container-padded text-center">
				<h1 className="page-title-small">Transaction</h1>
				<p className="error-text">Error: {error}</p>
			</div>
		);
	}

	return (
		<div className="container-wide page-container-padded">
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
				<p>Transaction not found</p>
			)}
		</div>
	);
}
