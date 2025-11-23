import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useEffect, useState } from "react";
import { Block } from "../../types";
import BlockDisplay from "../common/BlockDisplay";

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
			<div className="container-wide page-container-padded text-center">
				<h1 className="page-title-small">Block</h1>
				<p className="table-cell-muted">Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container-wide page-container-padded text-center">
				<h1 className="page-title-small">Block</h1>
				<p className="error-text">Error: {error}</p>
			</div>
		);
	}

	return (
		<div className="container-wide page-container-padded">
			{block ? (
				<>
					<BlockDisplay block={block} chainId={chainId} />
				</>
			) : (
				<p>Block not found</p>
			)}
		</div>
	);
}
