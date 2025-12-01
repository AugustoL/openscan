import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import type { Block } from "../../types";
import Loader from "../common/Loader";

const BLOCKS_PER_PAGE = 10;

export default function Blocks() {
  const { chainId } = useParams<{ chainId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const numericChainId = Number(chainId) || 1;
  const dataService = useDataService(numericChainId);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestBlockNumber, setLatestBlockNumber] = useState<number | null>(null);

  // Get fromBlock from URL params, default to null (latest)
  const fromBlockParam = searchParams.get("fromBlock");
  const fromBlock = fromBlockParam ? Number(fromBlockParam) : null;

  useEffect(() => {
    if (!dataService) {
      setLoading(false);
      return;
    }

    const fetchBlocks = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get the latest block number first
        const latestBlock = await dataService.getLatestBlockNumber();
        setLatestBlockNumber(latestBlock);

        // Determine starting block
        const startBlock = fromBlock !== null ? fromBlock : latestBlock;

        // Calculate block numbers to fetch (going backwards from startBlock)
        const blockNumbers = Array.from(
          { length: BLOCKS_PER_PAGE },
          (_, i) => startBlock - i,
        ).filter((num) => num >= 0);

        // Fetch blocks in parallel
        const blockResults = await Promise.all(
          blockNumbers.map((num) => dataService.getBlock(num)),
        );

        console.log("Fetched blocks:", blockResults);
        // Extract data from results
        setBlocks(blockResults.map((result) => result.data));
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      } catch (err: any) {
        console.error("Error fetching blocks:", err);
        setError(err.message || "Failed to fetch blocks");
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [dataService, fromBlock]);

  const truncate = (str: string, start = 10, end = 8) => {
    if (!str) return "";
    if (str.length <= start + end) return str;
    return `${str.slice(0, start)}...${str.slice(-end)}`;
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleString();
    } catch (_e) {
      return timestamp;
    }
  };

  // Navigation handlers
  const goToNewerBlocks = () => {
    if (blocks.length === 0 || latestBlockNumber === null || !blocks[0]) return;
    const newestBlockInPage = Number(blocks[0].number);
    const newFromBlock = Math.min(newestBlockInPage + BLOCKS_PER_PAGE, latestBlockNumber);

    if (newFromBlock >= latestBlockNumber) {
      // Go to latest (remove fromBlock param)
      navigate(`/${chainId}/blocks`);
    } else {
      navigate(`/${chainId}/blocks?fromBlock=${newFromBlock}`);
    }
  };

  const goToOlderBlocks = () => {
    if (blocks.length === 0) return;
    const lastBlock = blocks[blocks.length - 1];
    if (!lastBlock) return;
    const oldestBlockInPage = Number(lastBlock.number);
    const newFromBlock = oldestBlockInPage - 1;

    if (newFromBlock >= 0) {
      navigate(`/${chainId}/blocks?fromBlock=${newFromBlock}`);
    }
  };

  const goToLatest = () => {
    navigate(`/${chainId}/blocks`);
  };

  // Determine if we can navigate
  const lastBlock = blocks[blocks.length - 1];
  const canGoNewer =
    fromBlock !== null && latestBlockNumber !== null && fromBlock < latestBlockNumber;
  const canGoOlder = blocks.length > 0 && lastBlock && Number(lastBlock.number) > 0;
  const isAtLatest =
    fromBlock === null || (latestBlockNumber !== null && fromBlock >= latestBlockNumber);

  if (loading) {
    return (
      <div className="container-wide page-container-padded text-center page-card">
        <h1 className="page-title-small">Latest Blocks</h1>
        <Loader text="Loading blocks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-wide page-container-padded text-center page-card">
        <h1 className="page-title-small">Latest Blocks</h1>
        <p className="error-text">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container-wide page-container-padded text-center page-card">
      <h1 className="page-title-small">Latest Blocks</h1>
      <p className="page-subtitle-text">
        {isAtLatest
          ? `Showing ${blocks.length} most recent blocks`
          : `Showing blocks ${Number(blocks[blocks.length - 1]?.number || 0).toLocaleString()} - ${Number(blocks[0]?.number || 0).toLocaleString()}`}
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
                <td className="table-cell-text">{formatTime(block.timestamp)}</td>
                <td className="table-cell-value">
                  {block.transactions ? block.transactions.length : 0}
                </td>
                <td className="table-cell-mono" title={block.miner}>
                  <Link to={`/${chainId}/address/${block.miner}`} className="table-cell-address">
                    {truncate(block.miner)}
                  </Link>
                </td>
                <td className="table-cell-text">{Number(block.gasUsed).toLocaleString()}</td>
                <td className="table-cell-muted">{Number(block.gasLimit).toLocaleString()}</td>
                <td className="table-cell-muted">{Number(block.size).toLocaleString()} bytes</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
        <button
          onClick={goToLatest}
          disabled={isAtLatest}
          className="pagination-btn"
          title="Go to latest blocks"
        >
          Latest
        </button>
        {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
        <button
          onClick={goToNewerBlocks}
          disabled={!canGoNewer}
          className="pagination-btn"
          title="View newer blocks"
        >
          ← Newer
        </button>
        {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
        <button
          onClick={goToOlderBlocks}
          disabled={!canGoOlder}
          className="pagination-btn"
          title="View older blocks"
        >
          Older →
        </button>
      </div>
    </div>
  );
}
