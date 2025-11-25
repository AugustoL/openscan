import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useContext, useEffect, useState } from "react";
import { Address as AddressType, AddressTransactionsResult, Transaction } from "../../types";
import AddressDisplay from "../common/AddressDisplay";
import Loader from "../common/Loader";
import { useZipJsonReader } from "../../hooks/useZipJsonReader";
import { AppContext } from "../../context";

export default function Address() {
	const { chainId, address } = useParams<{
		chainId?: string;
		address?: string;
	}>();
	const numericChainId = Number(chainId) || 1;
	const dataService = useDataService(numericChainId);
	const [addressData, setAddressData] = useState<AddressType | null>(null);
	const [transactionsResult, setTransactionsResult] = useState<AddressTransactionsResult | null>(null);
	const [transactionDetails, setTransactionDetails] = useState<Transaction[]>([]);
	const [loadingTxDetails, setLoadingTxDetails] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!dataService || !address) {
			setLoading(false);
			return;
		}

		console.log(
			"Fetching address data for:",
			address,
			"on chain:",
			numericChainId,
		);
		setLoading(true);
		setError(null);

		// Fetch address data
		dataService
			.getAddress(address)
			.then((fetchedAddress) => {
				console.log("Fetched address:", fetchedAddress);
				setAddressData(fetchedAddress);
			})
			.catch((err) => {
				console.error("Error fetching address:", err);
				setError(err.message || "Failed to fetch address data");
			})
			.finally(() => setLoading(false));

		// Fetch transactions separately using new trace_filter/logs method
		dataService
			.getAddressTransactions(address)
			.then(async (result) => {
				console.log("Fetched transactions result:", result);
				setTransactionsResult(result);
				
				// Fetch full transaction details for first 25 transactions
				if (result.transactions.length > 0) {
					setLoadingTxDetails(true);
					const txsToFetch = result.transactions.slice(0, 25);
					const details = await Promise.all(
						txsToFetch.map(hash => 
							dataService.getTransaction(hash).catch(err => {
								console.error(`Failed to fetch tx ${hash}:`, err);
								return null;
							})
						)
					);
					setTransactionDetails(details.filter((tx): tx is Transaction => tx !== null));
					setLoadingTxDetails(false);
				}
			})
			.catch((err) => {
				console.error("Error fetching address transactions:", err);
				// Non-critical error, don't set main error state
				setTransactionsResult({
					transactions: [],
					source: "none",
					isComplete: false,
					message: "Failed to fetch transaction history: " + err.message,
				});
			});
	}, [dataService, address, numericChainId]);

	if (loading) {
		return (
			<div className="container-wide" style={{ padding: "20px" }}>
				<div className="block-display-card">
					<div className="block-display-header">
						<span className="block-label">Address</span>
						<span className="tx-mono" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
							{address}
						</span>
					</div>
					<div style={{ padding: "48px 24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
						<Loader text="Loading address data..." />
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
						<span className="block-label">Address</span>
						<span className="tx-mono" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
							{address}
						</span>
					</div>
					<div style={{ padding: "24px" }}>
						<p style={{ color: "#ef4444", margin: 0 }}>Error: {error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (!address) {
		return (
			<div className="container-wide" style={{ padding: "20px" }}>
				<div className="block-display-card">
					<div className="block-display-header">
						<span className="block-label">Address</span>
					</div>
					<div style={{ padding: "24px" }}>
						<p style={{ color: "#9ca3af", margin: 0 }}>No address provided</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container-wide" style={{ padding: "20px" }}>
			{addressData ? (
				<>
					<AddressDisplay
						address={addressData}
						addressHash={address}
						chainId={chainId}
						transactionsResult={transactionsResult}
						transactionDetails={transactionDetails}
						loadingTxDetails={loadingTxDetails}
					/>
				</>
			) : (
				<p>Address data not found</p>
			)}
		</div>
	);
}
