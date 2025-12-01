import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDataService } from "../../hooks/useDataService";
import { useProviderSelection } from "../../hooks/useProviderSelection";
import { useSelectedData } from "../../hooks/useSelectedData";
import type {
  AddressTransactionsResult,
  Address as AddressType,
  DataWithMetadata,
  Transaction,
} from "../../types";
import AddressDisplay from "../common/AddressDisplay";
import Loader from "../common/Loader";

export default function Address() {
  const { chainId, address } = useParams<{
    chainId?: string;
    address?: string;
  }>();
  const numericChainId = Number(chainId) || 1;
  const dataService = useDataService(numericChainId);
  const [addressResult, setAddressResult] = useState<DataWithMetadata<AddressType> | null>(null);
  const [transactionsResult, setTransactionsResult] = useState<AddressTransactionsResult | null>(
    null,
  );
  const [transactionDetails, setTransactionDetails] = useState<Transaction[]>([]);
  const [loadingTxDetails, setLoadingTxDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Provider selection state
  const [selectedProvider, setSelectedProvider] = useProviderSelection(
    `address_${numericChainId}_${address}`,
  );

  // Extract actual address data based on selected provider
  const addressData = useSelectedData(addressResult, selectedProvider);

  useEffect(() => {
    if (!dataService || !address) {
      setLoading(false);
      return;
    }

    console.log("Fetching address data for:", address, "on chain:", numericChainId);
    setLoading(true);
    setError(null);

    // Fetch address data
    dataService
      .getAddress(address)
      .then((result) => {
        console.log("Fetched address:", result);
        setAddressResult(result);
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
          const txResults = await Promise.all(
            txsToFetch.map((hash) =>
              dataService.getTransaction(hash).catch((err) => {
                console.error(`Failed to fetch tx ${hash}:`, err);
                return null;
              }),
            ),
          );
          setTransactionDetails(
            txResults
              .filter((result): result is DataWithMetadata<Transaction> => result !== null)
              .map((result) => result.data),
          );
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
          message: `Failed to fetch transaction history: ${err.message}`,
        });
      });
  }, [dataService, address, numericChainId]);

  if (loading) {
    return (
      <div className="container-wide container-padded">
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Address</span>
            <span className="tx-mono header-subtitle">{address}</span>
          </div>
          <div className="card-content-loading">
            <Loader text="Loading address data..." />
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
            <span className="block-label">Address</span>
            <span className="tx-mono header-subtitle">{address}</span>
          </div>
          <div className="card-content">
            <p className="text-error margin-0">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="container-wide container-padded">
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Address</span>
          </div>
          <div className="card-content">
            <p className="text-muted margin-0">No address provided</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide container-padded">
      {addressData ? (
        <AddressDisplay
          address={addressData}
          addressHash={address}
          chainId={chainId}
          transactionsResult={transactionsResult}
          transactionDetails={transactionDetails}
          loadingTxDetails={loadingTxDetails}
          metadata={addressResult?.metadata}
          selectedProvider={selectedProvider}
          onProviderSelect={setSelectedProvider}
        />
      ) : (
        <p>Address data not found</p>
      )}
    </div>
  );
}
