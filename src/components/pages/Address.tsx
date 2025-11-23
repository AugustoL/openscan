import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useContext, useEffect, useState } from "react";
import { Address as AddressType } from "../../types";
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
	}, [dataService, address, numericChainId]);

	if (loading) {
		return (
			<div className="container-wide" style={{ padding: "20px" }}>
				<h1
					style={{
						fontFamily: "Outfit, sans-serif",
						fontSize: "2rem",
						color: "#059669",
						marginBottom: "1rem",
					}}
				>
					Address
				</h1>
				<Loader text="Loading address data..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="container-wide" style={{ padding: "20px" }}>
				<h1
					style={{
						fontFamily: "Outfit, sans-serif",
						fontSize: "2rem",
						color: "#059669",
						marginBottom: "1rem",
					}}
				>
					Address
				</h1>
				<p style={{ color: "red" }}>Error: {error}</p>
			</div>
		);
	}

	if (!address) {
		return (
			<div className="container-wide" style={{ padding: "20px" }}>
				<h1
					style={{
						fontFamily: "Outfit, sans-serif",
						fontSize: "2rem",
						color: "#059669",
						marginBottom: "1rem",
					}}
				>
					Address
				</h1>
				<p>No address provided</p>
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
					/>
				</>
			) : (
				<p>Address data not found</p>
			)}
		</div>
	);
}
