import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useEffect, useState } from "react";
import SearchBox from "../common/SearchBox";
import NetworkStatsDisplay from "../common/NetworkStatsDisplay";
import Loader from "../common/Loader";
import { NetworkStats } from "../../types";

export default function Chain() {
	const { chainId } = useParams<{ chainId?: string }>();
	const numericChainId = Number(chainId) || 1;
	const dataService = useDataService(numericChainId);
	const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!dataService) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		dataService
			.getNetworkStats()
			.then((stats) => {
				setNetworkStats(stats);
			})
			.catch((err) => {
				setError(err.message || "Failed to fetch network stats");
			})
			.finally(() => setLoading(false));
	}, [dataService, numericChainId]);

	return (
		<div className="home-container">
			<div className="home-content">
				<h1 className="home-title">OPENSCAN</h1>
				<SearchBox />
				{loading && <Loader text="Loading network stats..." />}
				{error && <p className="error-text-center">Error: {error}</p>}
				{networkStats && (
					<NetworkStatsDisplay
						networkStats={networkStats}
						chainId={numericChainId}
					/>
				)}
			</div>
		</div>
	);
}
