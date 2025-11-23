import { useParams, Link } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useEffect, useState } from "react";
import { Transaction } from "../../types";
import Loader from "../common/Loader";

export default function Txs() {
	const { chainId } = useParams<{ chainId?: string }>();
	const numericChainId = Number(chainId) || 1;
	const dataService = useDataService(numericChainId);
	const [transactions, setTransactions] = useState<
		Array<Transaction & { blockNumber: string }>
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!dataService) {
			setLoading(false);
			return;
		}

		console.log(
			"Fetching transactions from latest 10 blocks for chain:",
			numericChainId,
		);
		setLoading(true);
		setError(null);

		dataService
			.getTransactionsFromLatestBlocks(10)
			.then((fetchedTransactions) => {
				console.log("Fetched transactions:", fetchedTransactions);
				setTransactions(fetchedTransactions);
			})
			.catch((err) => {
				console.error("Error fetching transactions:", err);
				setError(err.message || "Failed to fetch transactions");
			})
			.finally(() => setLoading(false));
	}, [dataService, numericChainId]);

	const truncate = (str: string, start = 10, end = 8) => {
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

	const formatGasPrice = (gasPrice: string) => {
		try {
			const gwei = Number(gasPrice) / 1e9;
			return `${gwei.toFixed(2)} Gwei`;
		} catch (e) {
			return gasPrice;
		}
	};

	if (loading) {
		return (
			<div className="container-wide page-container-padded text-center">
				<h1 className="page-title-small">Latest Transactions</h1>
				<Loader text="Loading transactions from the last 10 blocks..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="container-wide page-container-padded text-center">
				<h1 className="page-title-small">Latest Transactions</h1>
				<p className="error-text">Error: {error}</p>
			</div>
		);
	}

	return (
		<div className="container-wide page-container-padded text-center">
			<h1 className="page-title-small">Latest Transactions</h1>
			<p className="page-subtitle-text">
				Showing {transactions.length} transactions from the last 10 blocks
			</p>

			{transactions.length === 0 ? (
				<p className="table-cell-muted">
					No transactions found in the last 10 blocks
				</p>
			) : (
				<div className="table-wrapper">
					<table className="dash-table">
						<thead>
							<tr>
								<th>Tx Hash</th>
								<th>Block</th>
								<th>From</th>
								<th>To</th>
								<th>Value</th>
								<th>Gas Price</th>
								<th>Gas</th>
							</tr>
						</thead>
						<tbody>
							{transactions.map((transaction) => (
								<tr key={transaction.hash}>
									<td>
										<Link
											to={`/${chainId}/tx/${transaction.hash}`}
											className="table-cell-hash"
											title={transaction.hash}
										>
											{truncate(transaction.hash)}
										</Link>
									</td>
									<td>
										<Link
											to={`/${chainId}/block/${transaction.blockNumber}`}
											className="table-cell-value"
										>
											{transaction.blockNumber}
										</Link>
									</td>
									<td className="table-cell-mono" title={transaction.from}>
										<Link
											to={`/${chainId}/address/${transaction.from}`}
											className="table-cell-address"
										>
											{truncate(transaction.from)}
										</Link>
									</td>
									<td className="table-cell-mono" title={transaction.to}>
										{transaction.to ? (
											<Link
												to={`/${chainId}/address/${transaction.to}`}
												className="table-cell-address"
											>
												{truncate(transaction.to)}
											</Link>
										) : (
											<span className="table-cell-italic">
												Contract Creation
											</span>
										)}
									</td>
									<td className="table-cell-value">
										{formatValue(transaction.value)}
									</td>
									<td className="table-cell-muted">
										{formatGasPrice(transaction.gasPrice)}
									</td>
									<td className="table-cell-muted">
										{Number(transaction.gas).toLocaleString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
