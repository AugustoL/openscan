import type React from "react";
import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../../../context";
import { useSourcify } from "../../../../hooks/useSourcify";
import { fetchToken, getAssetUrl, type TokenMetadata } from "../../../../services/MetadataService";
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

interface ERC20DisplayProps {
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

const ERC20Display: React.FC<ERC20DisplayProps> = ({
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
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
  } | null>(null);

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

  // Fetch on-chain token data
  useEffect(() => {
    const fetchOnChainData = async () => {
      const chainId = Number(networkId);
      const rpcUrlsForChain = rpcUrls[chainId as keyof typeof rpcUrls];
      if (!rpcUrlsForChain) return;

      const rpcUrl = Array.isArray(rpcUrlsForChain) ? rpcUrlsForChain[0] : rpcUrlsForChain;
      if (!rpcUrl) return;

      const calls = [
        { selector: "0x06fdde03", key: "name" }, // name()
        { selector: "0x95d89b41", key: "symbol" }, // symbol()
        { selector: "0x313ce567", key: "decimals" }, // decimals()
        { selector: "0x18160ddd", key: "totalSupply" }, // totalSupply()
      ];

      const results: Record<string, string> = {};

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
            results[call.key] = data.result;
          }
        } catch {
          // Continue
        }
      }

      // Decode results
      const decoded: typeof onChainData = {};

      // Decode string (name, symbol)
      const decodeString = (hex: string): string => {
        try {
          // Remove 0x prefix
          const data = hex.slice(2);
          // Check if it's dynamic string (offset + length + data)
          if (data.length >= 128) {
            const lengthHex = data.slice(64, 128);
            const length = parseInt(lengthHex, 16);
            const strHex = data.slice(128, 128 + length * 2);
            return Buffer.from(strHex, "hex").toString("utf8");
          }
          return "";
        } catch {
          return "";
        }
      };

      if (results.name) {
        decoded.name = decodeString(results.name);
      }
      if (results.symbol) {
        decoded.symbol = decodeString(results.symbol);
      }
      if (results.decimals) {
        decoded.decimals = parseInt(results.decimals, 16);
      }
      if (results.totalSupply) {
        decoded.totalSupply = BigInt(results.totalSupply).toString();
      }

      setOnChainData(decoded);
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

  // Combine token data from metadata and on-chain
  const tokenName = tokenMetadata?.name || onChainData?.name;
  const tokenSymbol = tokenMetadata?.symbol || onChainData?.symbol;
  const tokenDecimals = tokenMetadata?.decimals ?? onChainData?.decimals;
  const tokenTotalSupply = onChainData?.totalSupply;
  const tokenLogo = tokenMetadata?.logo
    ? getAssetUrl(tokenMetadata.logo)
    : getAssetUrl(`assets/tokens/${networkId}/${addressHash.toLowerCase()}.png`);

  // Format total supply
  const formattedTotalSupply = useMemo(() => {
    if (!tokenTotalSupply || tokenDecimals === undefined) return null;
    try {
      const supply = BigInt(tokenTotalSupply);
      const divisor = BigInt(10 ** tokenDecimals);
      const whole = supply / divisor;
      return whole.toLocaleString();
    } catch {
      return tokenTotalSupply;
    }
  }, [tokenTotalSupply, tokenDecimals]);

  return (
    <div className="block-display-card">
      <AddressHeader
        addressHash={addressHash}
        addressType="erc20"
        ensName={ensName || reverseResult?.ensName}
        metadata={metadata}
        selectedProvider={selectedProvider}
        onProviderSelect={onProviderSelect}
        tokenSymbol={tokenSymbol}
        tokenName={tokenName}
      />

      <div className="address-section-content">
        {/* Token Details Section */}
        <div className="tx-details">
          <div className="tx-section">
            <span className="tx-section-title">Token Details</span>
          </div>

          {/* Token Logo and Name */}
          <div className="tx-row">
            <span className="tx-label">Token:</span>
            <span className="tx-value">
              <div className="token-info-row">
                <img
                  src={tokenLogo}
                  alt={tokenSymbol || "Token"}
                  className="token-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="token-name-symbol">
                  {tokenName && <span className="token-name">{tokenName}</span>}
                  {tokenSymbol && <span className="token-symbol">({tokenSymbol})</span>}
                </span>
              </div>
            </span>
          </div>

          {/* Decimals */}
          {tokenDecimals !== undefined && (
            <div className="tx-row">
              <span className="tx-label">Decimals:</span>
              <span className="tx-value">{tokenDecimals}</span>
            </div>
          )}

          {/* Total Supply */}
          {formattedTotalSupply && (
            <div className="tx-row">
              <span className="tx-label">Total Supply:</span>
              <span className="tx-value">
                {formattedTotalSupply} {tokenSymbol}
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

export default ERC20Display;
