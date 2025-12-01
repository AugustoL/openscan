import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useProviderSelection } from "../../hooks/useProviderSelection";
import { useSelectedData } from "../../hooks/useSelectedData";
import type { DataWithMetadata, Transaction } from "../../types";
import Loader from "../common/Loader";
import TransactionDisplay from "../common/TransactionDisplay";

export default function Tx() {
  const { chainId, filter } = useParams<{
    chainId?: string;
    filter?: string;
  }>();

  const txHash = filter;
  const numericChainId = Number(chainId) || 1;

  const dataService = useDataService(numericChainId);
  const [transactionResult, setTransactionResult] = useState<DataWithMetadata<Transaction> | null>(
    null,
  );
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Provider selection state
  const [selectedProvider, setSelectedProvider] = useProviderSelection(
    `tx_${numericChainId}_${txHash}`,
  );

  // Extract actual transaction data based on selected provider
  const transaction = useSelectedData(transactionResult, selectedProvider);

  useEffect(() => {
    if (!dataService || !txHash) {
      setLoading(false);
      return;
    }

    console.log("Fetching transaction:", txHash, "for chain:", numericChainId);
    setLoading(true);
    setError(null);

    Promise.all([dataService.getTransaction(txHash), dataService.getLatestBlockNumber()])
      .then(([result, latestBlock]) => {
        console.log("Fetched transaction:", result);
        console.log("Latest block number:", latestBlock);
        setTransactionResult(result);
        setCurrentBlockNumber(latestBlock);
      })
      .catch((err) => {
        console.error("Error fetching transaction:", err);
        setError(err.message || "Failed to fetch transaction");
      })
      .finally(() => setLoading(false));
  }, [dataService, txHash, numericChainId]);

  if (loading) {
    return (
      <div className="container-wide container-padded">
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Transaction</span>
            <span className="tx-mono header-subtitle">{txHash}</span>
          </div>
          <div className="card-content-loading">
            <Loader text="Loading transaction..." />
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
            <span className="block-label">Transaction</span>
            <span className="tx-mono header-subtitle">{txHash}</span>
          </div>
          <div className="card-content">
            <p className="error-text margin-0">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide container-padded">
      {transaction ? (
        <TransactionDisplay
          transaction={transaction}
          chainId={chainId}
          currentBlockNumber={currentBlockNumber || undefined}
          dataService={dataService}
          metadata={transactionResult?.metadata}
          selectedProvider={selectedProvider}
          onProviderSelect={setSelectedProvider}
        />
      ) : (
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Transaction</span>
          </div>
          <div className="card-content">
            <p className="text-muted margin-0">Transaction not found</p>
          </div>
        </div>
      )}
    </div>
  );
}
