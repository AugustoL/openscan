import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import type { Transaction } from "../../types";
import Loader from "../common/Loader";

const BLOCKS_PER_PAGE = 10;

export default function Txs() {
  const { chainId } = useParams<{ chainId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const numericChainId = Number(chainId) || 1;
  const dataService = useDataService(numericChainId);
  const [transactions, setTransactions] = useState<Array<Transaction & { blockNumber: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestBlockNumber, setLatestBlockNumber] = useState<number | null>(null);
  const [blockRange, setBlockRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

  // Get fromBlock from URL params, default to null (latest)
  const fromBlockParam = searchParams.get("fromBlock");
  const fromBlock = fromBlockParam ? Number(fromBlockParam) : null;

  useEffect(() => {
    if (!dataService) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get the latest block number first
        const latestBlock = await dataService.getLatestBlockNumber();
        setLatestBlockNumber(latestBlock);

        // Determine starting block
        const startBlock = fromBlock !== null ? fromBlock : latestBlock;

        // Calculate block range
        const endBlock = Math.max(startBlock - BLOCKS_PER_PAGE + 1, 0);
        setBlockRange({ from: endBlock, to: startBlock });

        // Fetch transactions from block range
        const fetchedTransactions = await dataService.getTransactionsFromBlockRange(
          startBlock,
          BLOCKS_PER_PAGE,
        );

        console.log("Fetched transactions:", fetchedTransactions);
        setTransactions(fetchedTransactions);
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError(err.message || "Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [dataService, fromBlock]);

  const truncate = (str: string, start = 10, end = 8) => {
    if (!str) return "";
    if (str.length <= start + end) return str;
    return `${str.slice(0, start)}...${str.slice(-end)}`;
  };

  const formatValue = (value: string) => {
    try {
      const eth = Number(value) / 1e18;
      return `${eth.toFixed(6)} ETH`;
    } catch (_e) {
      return value;
    }
  };

  const formatGasPrice = (gasPrice: string) => {
    try {
      const gwei = Number(gasPrice) / 1e9;
      return `${gwei.toFixed(2)} Gwei`;
    } catch (_e) {
      return gasPrice;
    }
  };

  // Navigation handlers
  const goToNewerBlocks = () => {
    if (!blockRange || latestBlockNumber === null) return;
    const newFromBlock = Math.min(blockRange.to + BLOCKS_PER_PAGE, latestBlockNumber);

    if (newFromBlock >= latestBlockNumber) {
      // Go to latest (remove fromBlock param)
      navigate(`/${chainId}/txs`);
    } else {
      navigate(`/${chainId}/txs?fromBlock=${newFromBlock}`);
    }
  };

  const goToOlderBlocks = () => {
    if (!blockRange) return;
    const newFromBlock = blockRange.from - 1;

    if (newFromBlock >= 0) {
      navigate(`/${chainId}/txs?fromBlock=${newFromBlock}`);
    }
  };

  const goToLatest = () => {
    navigate(`/${chainId}/txs`);
  };

  // Determine if we can navigate
  const canGoNewer =
    fromBlock !== null && latestBlockNumber !== null && fromBlock < latestBlockNumber;
  const canGoOlder = blockRange !== null && blockRange.from > 0;
  const isAtLatest =
    fromBlock === null || (latestBlockNumber !== null && fromBlock >= latestBlockNumber);

  if (loading) {
    return (
      <div className="container-wide page-container-padded text-center page-card">
        <h1 className="page-title-small">Latest Transactions</h1>
        <Loader text="Loading transactions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-wide page-container-padded text-center page-card">
        <h1 className="page-title-small">Latest Transactions</h1>
        <p className="error-text">Error: {error}</p>
      </div>
    );
  }

  const Pagination = () => {
    // Pagination
    return (
      <div className="pagination-container no-margin-top">
        {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
        <button
          onClick={goToLatest}
          disabled={isAtLatest}
          className="pagination-btn"
          title="Go to latest transactions"
        >
          Latest
        </button>
        {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
        <button
          onClick={goToNewerBlocks}
          disabled={!canGoNewer}
          className="pagination-btn"
          title="View newer transactions"
        >
          ← Newer
        </button>
        {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
        <button
          onClick={goToOlderBlocks}
          disabled={!canGoOlder}
          className="pagination-btn"
          title="View older transactions"
        >
          Older →
        </button>
      </div>
    );
  };

  return (
    <div className="container-wide page-container-padded text-center page-card">
      <h1 className="page-title-small">Latest Transactions</h1>
      <p className="page-subtitle-text no-margin-bottom">
        {isAtLatest
          ? `Showing ${transactions.length} transactions from the last ${BLOCKS_PER_PAGE} blocks`
          : blockRange
            ? `Showing ${transactions.length} transactions from blocks ${blockRange.from.toLocaleString()} - ${blockRange.to.toLocaleString()}`
            : `Showing ${transactions.length} transactions`}
      </p>

      <Pagination />

      {transactions.length === 0 ? (
        <p className="table-cell-muted">No transactions found in the selected block range</p>
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
                      <span className="table-cell-italic">Contract Creation</span>
                    )}
                  </td>
                  <td className="table-cell-value">{formatValue(transaction.value)}</td>
                  <td className="table-cell-muted">{formatGasPrice(transaction.gasPrice)}</td>
                  <td className="table-cell-muted">{Number(transaction.gas).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination />
    </div>
  );
}
