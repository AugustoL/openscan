import type React from "react";
import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../../../context";
import { useSourcify } from "../../../../hooks/useSourcify";
import { fetchToken, getAssetUrl, type TokenMetadata } from "../../../../services/MetadataService";
import { decodeAbiString } from "../../../../utils/hexUtils";
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
import { AddressHeader, ContractDetails, TransactionHistory } from "../shared";

interface ERC1155DisplayProps {
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

const ERC1155Display: React.FC<ERC1155DisplayProps> = ({
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
  const { jsonFiles, rpcUrls } = useContext(AppContext);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [onChainData, setOnChainData] = useState<{
    uri?: string;
    name?: string;
    symbol?: string;
  } | null>(null);
  const [tokenIdInput, setTokenIdInput] = useState("");

  // Fetch Sourcify data
  const {
    data: sourcifyData,
    loading: sourcifyLoading,
    isVerified,
  } = useSourcify(Number(networkId), addressHash, true);

  // Fetch token metadata from explorer-metadata
  useEffect(() => {
    fetchToken(Number(networkId), addressHash).then(setTokenMetadata).catch(console.error);
  }, [networkId, addressHash]);

  // Fetch on-chain ERC1155 data
  useEffect(() => {
    const fetchOnChainData = async () => {
      const chainId = Number(networkId);
      const rpcUrlsForChain = rpcUrls[chainId as keyof typeof rpcUrls];
      if (!rpcUrlsForChain) return;

      const rpcUrl = Array.isArray(rpcUrlsForChain) ? rpcUrlsForChain[0] : rpcUrlsForChain;
      if (!rpcUrl) return;

      const results: { uri?: string; name?: string; symbol?: string } = {};

      // Fetch name and symbol
      const calls = [
        { selector: "0x06fdde03", key: "name" }, // name()
        { selector: "0x95d89b41", key: "symbol" }, // symbol()
      ];

      for (const call of calls) {
        try {
          const response = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_call",
              params: [{ to: addressHash, data: call.selector }, "latest"],
              id: 1,
            }),
          });
          const data = await response.json();
          if (!data.error && data.result && data.result !== "0x") {
            const decoded = decodeAbiString(data.result);
            if (decoded) {
              results[call.key as "name" | "symbol"] = decoded;
            }
          }
        } catch {
          // Continue
        }
      }

      // Try to get URI for token ID 0 as a sample
      // uri(uint256) with tokenId = 0
      const uriSelector =
        "0x0e89341c0000000000000000000000000000000000000000000000000000000000000000";

      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_call",
            params: [{ to: addressHash, data: uriSelector }, "latest"],
            id: 1,
          }),
        });
        const data = await response.json();
        if (!data.error && data.result && data.result !== "0x") {
          const uri = decodeAbiString(data.result);
          if (uri) {
            results.uri = uri;
          }
        }
      } catch {
        // Continue
      }

      if (Object.keys(results).length > 0) {
        setOnChainData(results);
      }
    };

    fetchOnChainData();
  }, [networkId, addressHash, rpcUrls]);

  // Check if we have local artifact data
  const localArtifact = jsonFiles[addressHash.toLowerCase()];

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

  const contractData = useMemo(
    () => (isVerified && sourcifyData ? sourcifyData : parsedLocalData),
    [isVerified, sourcifyData, parsedLocalData],
  );

  const hasVerifiedContract = isVerified || parsedLocalData;

  // Combine token data
  const collectionName = tokenMetadata?.name || onChainData?.name || contractData?.name;
  const collectionSymbol = tokenMetadata?.symbol || onChainData?.symbol;
  const collectionLogo = tokenMetadata?.logo
    ? getAssetUrl(tokenMetadata.logo)
    : getAssetUrl(`assets/tokens/${networkId}/${addressHash.toLowerCase()}.png`);

  return (
    <div className="block-display-card">
      <AddressHeader
        addressHash={addressHash}
        addressType="erc1155"
        ensName={ensName || reverseResult?.ensName}
        metadata={metadata}
        selectedProvider={selectedProvider}
        onProviderSelect={onProviderSelect}
        tokenSymbol={collectionSymbol}
        tokenName={collectionName}
      />

      <div className="address-section-content">
        {/* Multi-Token Collection Details */}
        <div className="tx-details">
          <div className="tx-section">
            <span className="tx-section-title">Multi-Token Collection Details</span>
          </div>

          {/* Collection Logo and Name */}
          <div className="tx-row">
            <span className="tx-label">Collection:</span>
            <span className="tx-value">
              <div className="token-info-row">
                <img
                  src={collectionLogo}
                  alt={collectionSymbol || "Multi-Token Collection"}
                  className="token-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="token-name-symbol">
                  {collectionName && <span className="token-name">{collectionName}</span>}
                  {collectionSymbol && <span className="token-symbol">({collectionSymbol})</span>}
                </span>
              </div>
            </span>
          </div>

          {/* Token Standard */}
          <div className="tx-row">
            <span className="tx-label">Token Standard:</span>
            <span className="tx-value">
              <span className="token-standard-badge token-standard-erc1155">ERC-1155</span>
            </span>
          </div>

          {/* Metadata URI */}
          {onChainData?.uri && (
            <div className="tx-row">
              <span className="tx-label">Metadata URI:</span>
              <span className="tx-value">
                <span className="tx-mono word-break-all">
                  {onChainData.uri.length > 60
                    ? `${onChainData.uri.slice(0, 60)}...`
                    : onChainData.uri}
                </span>
              </span>
            </div>
          )}

          {/* Balance */}
          <div className="tx-row">
            <span className="tx-label">Contract Balance:</span>
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
        </div>

        {/* Token ID Lookup */}
        <div className="tx-details">
          <div className="tx-section">
            <span className="tx-section-title">View Token</span>
          </div>
          <div className="erc1155-token-lookup">
            <div className="erc1155-token-lookup-row">
              <input
                type="text"
                placeholder="Enter Token ID"
                value={tokenIdInput}
                onChange={(e) => setTokenIdInput(e.target.value)}
                className="erc1155-token-input"
              />
              <Link
                to={tokenIdInput ? `/${networkId}/address/${addressHash}/${tokenIdInput}` : "#"}
                className={`erc1155-view-button ${!tokenIdInput ? "disabled" : ""}`}
                onClick={(e) => {
                  if (!tokenIdInput) {
                    e.preventDefault();
                  }
                }}
              >
                View Token
              </Link>
            </div>
          </div>
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
      </div>
    </div>
  );
};

export default ERC1155Display;
