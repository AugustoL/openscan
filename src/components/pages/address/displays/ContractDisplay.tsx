import type React from "react";
import { useContext, useMemo } from "react";
import { AppContext } from "../../../../context";
import { useSourcify } from "../../../../hooks/useSourcify";
import type {
  Address,
  AddressTransactionsResult,
  DecodedContenthash,
  ENSRecords,
  ENSReverseResult,
  RPCMetadata,
  Transaction,
} from "../../../../types";
import ENSRecordsDetails from "../shared/ENSRecordsDisplay";
import { AddressHeader, ContractDetails, ContractStorage, TransactionHistory } from "../shared";

interface ContractDisplayProps {
  address: Address;
  addressHash: string;
  networkId: string;
  transactionsResult?: AddressTransactionsResult | null;
  transactionDetails: Transaction[];
  loadingTxDetails: boolean;
  metadata?: RPCMetadata;
  selectedProvider?: string | null;
  onProviderSelect?: (provider: string) => void;
  // ENS props
  ensName?: string | null;
  reverseResult?: ENSReverseResult | null;
  ensRecords?: ENSRecords | null;
  decodedContenthash?: DecodedContenthash | null;
  ensLoading?: boolean;
  isMainnet?: boolean;
}

const ContractDisplay: React.FC<ContractDisplayProps> = ({
  address,
  addressHash,
  networkId,
  transactionsResult,
  transactionDetails,
  loadingTxDetails,
  metadata,
  selectedProvider,
  onProviderSelect,
  ensName,
  reverseResult,
  ensRecords,
  decodedContenthash,
  ensLoading = false,
  isMainnet = true,
}) => {
  const { jsonFiles } = useContext(AppContext);

  // Fetch Sourcify data
  const {
    data: sourcifyData,
    loading: sourcifyLoading,
    isVerified,
  } = useSourcify(Number(networkId), addressHash, true);

  // Check if we have local artifact data for this address
  const localArtifact = jsonFiles[addressHash.toLowerCase()];

  // Parse local artifact to sourcify format if it exists
  const parsedLocalData = useMemo(() => {
    if (!localArtifact) return null;
    return {
      name: localArtifact.contractName,
      compilerVersion: localArtifact.buildInfo?.solcLongVersion,
      evmVersion: localArtifact.buildInfo?.input?.settings?.evmVersion,
      abi: localArtifact.abi,
      files: localArtifact.sourceCode
        ? [
            {
              name: localArtifact.sourceName || "Contract.sol",
              path: localArtifact.sourceName || "Contract.sol",
              content: localArtifact.sourceCode,
            },
          ]
        : undefined,
      metadata: {
        language: localArtifact.buildInfo?.input?.language,
        compiler: localArtifact.buildInfo
          ? { version: localArtifact.buildInfo.solcVersion }
          : undefined,
      },
      match: "perfect" as const,
      creation_match: null,
      runtime_match: null,
      chainId: networkId,
      address: addressHash,
      verifiedAt: undefined,
    };
  }, [localArtifact, networkId, addressHash]);

  // Use local artifact data if available and sourcify is not verified
  const contractData = useMemo(
    () => (isVerified && sourcifyData ? sourcifyData : parsedLocalData),
    [isVerified, sourcifyData, parsedLocalData],
  );

  const hasVerifiedContract = isVerified || parsedLocalData;

  return (
    <div className="block-display-card">
      <AddressHeader
        addressHash={addressHash}
        addressType="contract"
        ensName={ensName || reverseResult?.ensName}
        metadata={metadata}
        selectedProvider={selectedProvider}
        onProviderSelect={onProviderSelect}
      />

      <div className="address-section-content">
        {/* Address Details Section */}
        <div className="tx-details">
          <div className="tx-section">
            <span className="tx-section-title">Contract Details</span>
          </div>

          {/* Balance */}
          <div className="tx-row">
            <span className="tx-label">Balance:</span>
            <span className="tx-value">
              <span className="tx-value-highlight">
                {(() => {
                  try {
                    const eth = Number(address.balance) / 1e18;
                    return `${eth.toFixed(6)} ETH`;
                  } catch {
                    return address.balance;
                  }
                })()}
              </span>
            </span>
          </div>

          {/* Transaction Count */}
          <div className="tx-row">
            <span className="tx-label">Transactions:</span>
            <span className="tx-value">{Number(address.txCount).toLocaleString()} txns</span>
          </div>

          {/* Verification Status */}
          <div className="tx-row">
            <span className="tx-label">Contract Verified:</span>
            <span className="tx-value">
              {sourcifyLoading ? (
                <span className="verification-checking">Checking Sourcify...</span>
              ) : hasVerifiedContract ? (
                <span className="flex-align-center-gap-8">
                  <span className="tx-value-highlight">✓ Verified</span>
                  {contractData?.match && (
                    <span className="match-badge match-badge-full">
                      {contractData.match === "perfect"
                        ? parsedLocalData
                          ? "Local JSON"
                          : "Perfect Match"
                        : "Partial Match"}
                    </span>
                  )}
                </span>
              ) : (
                <span className="verification-not-verified">Not Verified</span>
              )}
            </span>
          </div>

          {/* Contract Name (if verified) */}
          {contractData?.name && (
            <div className="tx-row">
              <span className="tx-label">Contract Name:</span>
              <span className="tx-value">{contractData.name}</span>
            </div>
          )}

          {/* Compiler Version (if verified) */}
          {contractData?.compilerVersion && (
            <div className="tx-row">
              <span className="tx-label">Compiler:</span>
              <span className="tx-value tx-mono">{contractData.compilerVersion}</span>
            </div>
          )}
        </div>

        {/* ENS Records Section */}
        {(ensName || reverseResult?.ensName || ensLoading) && (
          <ENSRecordsDetails
            ensName={ensName || null}
            reverseResult={reverseResult}
            records={ensRecords}
            decodedContenthash={decodedContenthash}
            loading={ensLoading}
            isMainnet={isMainnet}
          />
        )}

        {/* Contract Verification Details */}
        {hasVerifiedContract && contractData && (
          <ContractDetails
            addressHash={addressHash}
            networkId={networkId}
            code={address.code}
            contractData={contractData}
            isLocalArtifact={!!parsedLocalData && !isVerified}
            sourcifyUrl={
              sourcifyData
                ? `https://repo.sourcify.dev/contracts/full_match/${networkId}/${addressHash}/`
                : undefined
            }
          />
        )}

        {/* Transaction History */}
        <TransactionHistory
          networkId={networkId}
          addressHash={addressHash}
          transactionsResult={transactionsResult}
          transactionDetails={transactionDetails}
          loadingTxDetails={loadingTxDetails}
          contractAbi={contractData?.abi}
        />

        {/* Contract Storage */}
        <ContractStorage address={address} />
      </div>
    </div>
  );
};

export default ContractDisplay;
