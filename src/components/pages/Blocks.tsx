import { useParams, Link } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useEffect, useState } from "react";
import { Block } from "../../types";
import Loader from "../common/Loader";

export default function Blocks() {
	const { chainId } = useParams<{ chainId?: string }>();
	const numericChainId = Number(chainId) || 1;
	const dataService = useDataService(numericChainId);
	const [blocks, setBlocks] = useState<Block[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!dataService) {
			setLoading(false);
			return;
		}

		console.log("Fetching latest 10 blocks for chain:", numericChainId);
		setLoading(true);
		setError(null);

		dataService
			.getLatestBlocks(10)
			.then((fetchedBlocks) => {
				console.log("Fetched blocks:", fetchedBlocks);
				setBlocks(fetchedBlocks);
			})
			.catch((err) => {
				console.error("Error fetching blocks:", err);
				setError(err.message || "Failed to fetch blocks");
			})
			.finally(() => setLoading(false));
	}, [dataService, numericChainId]);

	const truncate = (str: string, start = 10, end = 8) => {
		if (!str) return "";
		if (str.length <= start + end) return str;
		return `${str.slice(0, start)}...${str.slice(-end)}`;
	};

	const formatTime = (timestamp: string) => {
		try {
			const date = new Date(Number(timestamp) * 1000);
			return date.toLocaleString();
		} catch (e) {
			return timestamp;
		}
	};

	if (loading) {
		return (
			<div className="container-wide page-container-padded text-center">
				<h1 className="page-title-small">Latest Blocks</h1>
				<Loader text="Loading blocks..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="container-wide page-container-padded text-center">
				<h1 className="page-title-small">Latest Blocks</h1>
				<p className="error-text">Error: {error}</p>
			</div>
		);
	}

	return (
		<div className="container-wide page-container-padded text-center">
			<h1 className="page-title-small">Latest Blocks</h1>
			<p className="page-subtitle-text">
				Showing {blocks.length} most recent blocks
			</p>

			<div className="table-wrapper">
				<table className="dash-table">
					<thead>
						<tr>
							<th>Block</th>
							<th>Timestamp</th>
							<th>Txns</th>
							<th>Miner</th>
							<th>Gas Used</th>
							<th>Gas Limit</th>
							<th>Size</th>
						</tr>
					</thead>
					<tbody>
						{blocks.map((block) => (
							<tr key={block.number}>
								<td>
									<Link
										to={`/${chainId}/block/${Number(block.number).toString()}`}
										className="table-cell-number"
									>
										{Number(block.number).toLocaleString()}
									</Link>
								</td>
								<td className="table-cell-text">
									{formatTime(block.timestamp)}
								</td>
								<td className="table-cell-value">
									{block.transactions ? block.transactions.length : 0}
								</td>
								<td className="table-cell-mono" title={block.miner}>
									<Link
										to={`/${chainId}/address/${block.miner}`}
										className="table-cell-address"
									>
										{truncate(block.miner)}
									</Link>
								</td>
								<td className="table-cell-text">
									{Number(block.gasUsed).toLocaleString()}
								</td>
								<td className="table-cell-muted">
									{Number(block.gasLimit).toLocaleString()}
								</td>
								<td className="table-cell-muted">
									{Number(block.size).toLocaleString()} bytes
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
