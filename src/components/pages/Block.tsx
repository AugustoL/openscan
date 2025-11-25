import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useEffect, useState } from "react";
import { Block } from "../../types";
import BlockDisplay from "../common/BlockDisplay";
import Loader from "../common/Loader";

export default function Block() {
	const { chainId, filter } = useParams<{
		chainId?: string;
		filter?: string;
	}>();
	const { chainId: chainIdParam, blockNumber: blockNumberParam } = useParams<{
		chainId: string;
		blockNumber: string;
	}>();

	const blockNumber = filter == "latest" ? "latest" : Number(filter);
	const numericChainId = Number(chainId) || 1;

	const dataService = useDataService(numericChainId);
	const [block, setBlock] = useState<Block | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!dataService || blockNumber === undefined) {
			setLoading(false);
			return;
		}

		console.log("Fetching block:", blockNumber, "for chain:", numericChainId);
		setLoading(true);
		setError(null);

		dataService
			.getBlock(blockNumber)
			.then((fetchedBlock) => {
				console.log("Fetched block:", fetchedBlock);
				setBlock(fetchedBlock);
			})
			.catch((err) => {
				console.error("Error fetching block:", err);
				setError(err.message || "Failed to fetch block");
			})
			.finally(() => setLoading(false));
	}, [dataService, blockNumber, numericChainId]);

	if (loading) {
		return (
			<div className="container-wide" style={{ padding: "20px" }}>
				<div className="block-display-card">
					<div className="block-display-header">
						<span className="block-label">Block</span>
						<span className="tx-mono" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
							#{filter}
						</span>
					</div>
					<div style={{ padding: "48px 24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
						<Loader text="Loading block data..." />
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
						<span className="block-label">Block</span>
						<span className="tx-mono" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
							#{filter}
						</span>
					</div>
					<div style={{ padding: "24px" }}>
						<p style={{ color: "#ef4444", margin: 0 }}>Error: {error}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container-wide" style={{ padding: "20px" }}>
			{block ? (
				<>
					<BlockDisplay block={block} chainId={chainId} />
				</>
			) : (
				<div className="block-display-card">
					<div className="block-display-header">
						<span className="block-label">Block</span>
					</div>
					<div style={{ padding: "24px" }}>
						<p style={{ color: "#9ca3af", margin: 0 }}>Block not found</p>
					</div>
				</div>
			)}
		</div>
	);
}
