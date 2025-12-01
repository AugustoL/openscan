import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useProviderSelection } from "../../hooks/useProviderSelection";
import { useSelectedData } from "../../hooks/useSelectedData";
import type { Block, DataWithMetadata } from "../../types";
import BlockDisplay from "../common/BlockDisplay";
import Loader from "../common/Loader";

export default function BlockPage() {
  const { chainId, filter } = useParams<{
    chainId?: string;
    filter?: string;
  }>();

  const blockNumber = filter === "latest" ? "latest" : Number(filter);
  const numericChainId = Number(chainId) || 1;

  const dataService = useDataService(numericChainId);
  const [blockResult, setBlockResult] = useState<DataWithMetadata<Block> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Provider selection state
  const [selectedProvider, setSelectedProvider] = useProviderSelection(
    `block_${numericChainId}_${blockNumber}`,
  );

  // Extract actual block data based on selected provider
  const block = useSelectedData(blockResult, selectedProvider);

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
      .then((result) => {
        console.log("Fetched block:", result);
        setBlockResult(result);
      })
      .catch((err) => {
        console.error("Error fetching block:", err);
        setError(err.message || "Failed to fetch block");
      })
      .finally(() => setLoading(false));
  }, [dataService, blockNumber, numericChainId]);

  if (loading) {
    return (
      <div className="container-wide container-padded">
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Block</span>
            <span className="tx-mono header-subtitle">#{filter}</span>
          </div>
          <div className="card-content-loading">
            <Loader text="Loading block data..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-wide container-padded">
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Block</span>
            <span className="tx-mono header-subtitle">#{filter}</span>
          </div>
          <div className="card-content">
            <p className="text-error margin-0">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide container-padded">
      {block ? (
        <BlockDisplay
          block={block}
          chainId={chainId}
          metadata={blockResult?.metadata}
          selectedProvider={selectedProvider}
          onProviderSelect={setSelectedProvider}
        />
      ) : (
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Block</span>
          </div>
          <div className="card-content">
            <p className="text-muted margin-0">Block not found</p>
          </div>
        </div>
      )}
    </div>
  );
}
