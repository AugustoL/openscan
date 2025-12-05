import type React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppContext } from "../../../context";
import {
  fetchCollectionInfo,
  fetchERC1155MetadataWithUri,
  fetchTokenBalance,
  getImageUrl,
  type CollectionInfo,
  type ERC1155TokenMetadata,
} from "../../../utils/erc1155Metadata";
import Loader from "../../common/Loader";

const ERC1155TokenDetails: React.FC = () => {
  const {
    networkId,
    address: contractAddress,
    tokenId,
  } = useParams<{
    networkId?: string;
    address?: string;
    tokenId?: string;
  }>();

  const { rpcUrls } = useContext(AppContext);
  const [metadata, setMetadata] = useState<ERC1155TokenMetadata | null>(null);
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenUri, setTokenUri] = useState<string | null>(null);

  // Balance lookup state
  const [balanceAddress, setBalanceAddress] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const numericNetworkId = Number(networkId) || 1;

  // Get RPC URL
  const rpcUrlsForChain = rpcUrls[numericNetworkId as keyof typeof rpcUrls];
  const rpcUrl = Array.isArray(rpcUrlsForChain) ? rpcUrlsForChain[0] : rpcUrlsForChain;

  // Fetch token metadata
  useEffect(() => {
    if (!contractAddress || !tokenId || !rpcUrl) {
      setLoading(false);
      setError("Missing contract address, token ID, or RPC URL");
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      fetchERC1155MetadataWithUri(contractAddress, tokenId, rpcUrl),
      fetchCollectionInfo(contractAddress, rpcUrl),
    ])
      .then(([metadataResult, collectionResult]) => {
        if (metadataResult.metadata) {
          setMetadata(metadataResult.metadata);
        } else {
          setError("Failed to fetch token metadata");
        }
        setTokenUri(metadataResult.tokenUri);
        setCollectionInfo(collectionResult);
      })
      .catch((err) => {
        console.error("Error fetching metadata:", err);
        setError(err.message || "Failed to fetch token metadata");
      })
      .finally(() => setLoading(false));
  }, [contractAddress, tokenId, rpcUrl]);

  // Handle balance lookup
  const handleBalanceLookup = useCallback(async () => {
    if (!balanceAddress || !contractAddress || !tokenId || !rpcUrl) {
      setBalanceError("Please enter a valid address");
      return;
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(balanceAddress)) {
      setBalanceError("Invalid address format");
      return;
    }

    setBalanceLoading(true);
    setBalanceError(null);
    setBalance(null);

    try {
      const result = await fetchTokenBalance(contractAddress, balanceAddress, tokenId, rpcUrl);
      if (result !== null) {
        setBalance(result);
      } else {
        setBalanceError("Failed to fetch balance");
      }
    } catch (err) {
      setBalanceError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setBalanceLoading(false);
    }
  }, [balanceAddress, contractAddress, tokenId, rpcUrl]);

  if (loading) {
    return (
      <div className="container-wide">
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">ERC-1155 Token</span>
            <span className="tx-mono header-subtitle">Token ID: {tokenId}</span>
          </div>
          <div className="card-content-loading">
            <Loader text="Loading token metadata..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-wide">
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">ERC-1155 Token</span>
            <span className="tx-mono header-subtitle">Token ID: {tokenId}</span>
          </div>
          <div className="card-content">
            <p className="text-error margin-0">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = metadata ? getImageUrl(metadata) : null;
  // Token name from metadata, collection name from contract
  const tokenName = metadata?.name;
  const collectionName = collectionInfo?.name;
  const collectionSymbol = collectionInfo?.symbol;

  return (
    <div className="container-wide">
      <div className="block-display-card">
        {/* Header Section */}
        <div className="block-display-header">
          <div className="erc1155-header">
            {/* Token name */}
            {tokenName && <span className="erc1155-token-name">{tokenName}</span>}
            {/* Collection name with symbol and Token ID on same line */}
            <div className="erc1155-header-title">
              {collectionName && (
                <Link
                  to={`/${networkId}/address/${contractAddress}`}
                  className="nft-collection-link"
                >
                  {collectionName}
                  {collectionSymbol && (
                    <span className="nft-collection-symbol">({collectionSymbol})</span>
                  )}
                </Link>
              )}
              <span className="tx-mono header-subtitle">Token ID: {tokenId}</span>
            </div>
          </div>
        </div>

        <div className="erc1155-detail-content">
          {/* Token Image and Basic Info */}
          <div className="erc1155-main-section">
            {imageUrl && (
              <div className="erc1155-image-container">
                <img
                  src={imageUrl}
                  alt={tokenName || `Token #${tokenId}`}
                  className="erc1155-token-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="tx-details">
              <div className="tx-section">
                <span className="tx-section-title">Token Details</span>
              </div>

              {/* Collection */}
              {collectionName && (
                <div className="tx-row">
                  <span className="tx-label">Collection:</span>
                  <span className="tx-value">
                    <Link to={`/${networkId}/address/${contractAddress}`} className="address-link">
                      {collectionName}
                      {collectionSymbol && ` (${collectionSymbol})`}
                    </Link>
                  </span>
                </div>
              )}

              {/* Contract Address */}
              <div className="tx-row">
                <span className="tx-label">Contract:</span>
                <span className="tx-value">
                  <Link to={`/${networkId}/address/${contractAddress}`} className="address-link">
                    {contractAddress}
                  </Link>
                </span>
              </div>

              {/* Token ID */}
              <div className="tx-row">
                <span className="tx-label">Token ID:</span>
                <span className="tx-value tx-mono">{tokenId}</span>
              </div>

              {/* Token Standard */}
              <div className="tx-row">
                <span className="tx-label">Token Standard:</span>
                <span className="tx-value">
                  <span className="token-standard-badge token-standard-erc1155">ERC-1155</span>
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {metadata?.description && (
            <div className="tx-details">
              <div className="tx-section">
                <span className="tx-section-title">Description</span>
              </div>
              <div className="nft-description">{metadata.description}</div>
            </div>
          )}

          {/* Properties/Attributes Section */}
          {metadata?.attributes && metadata.attributes.length > 0 && (
            <div className="tx-details">
              <div className="tx-section">
                <span className="tx-section-title">Properties</span>
                <span className="tx-section-count">{metadata.attributes.length}</span>
              </div>
              <div className="erc1155-attributes-grid">
                {metadata.attributes.map((attr, index) => (
                  <div key={`${attr.trait_type}-${index}`} className="erc1155-attribute-card">
                    <span className="erc1155-attribute-type">{attr.trait_type}</span>
                    <span className="erc1155-attribute-value">{String(attr.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Balance Lookup Section */}
          <div className="tx-details">
            <div className="tx-section">
              <span className="tx-section-title">Balance Lookup</span>
            </div>
            <div className="erc1155-balance-lookup">
              <div className="erc1155-balance-input-row">
                <input
                  type="text"
                  placeholder="Enter address (0x...)"
                  value={balanceAddress}
                  onChange={(e) => setBalanceAddress(e.target.value)}
                  className="erc1155-balance-input"
                />
                <button
                  type="button"
                  onClick={handleBalanceLookup}
                  disabled={balanceLoading}
                  className="erc1155-balance-button"
                >
                  {balanceLoading ? "Checking..." : "Check Balance"}
                </button>
              </div>

              {balanceError && <div className="erc1155-balance-error">{balanceError}</div>}

              {balance !== null && (
                <div className="erc1155-balance-result">
                  <span className="erc1155-balance-label">Balance:</span>
                  <span className="erc1155-balance-value">{balance}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links Section */}
          {(metadata?.external_url || metadata?.animation_url) && (
            <div className="tx-details">
              <div className="tx-section">
                <span className="tx-section-title">Links</span>
              </div>
              <div className="nft-links">
                {metadata?.external_url && (
                  <a
                    href={metadata.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nft-link-button"
                  >
                    External URL ↗
                  </a>
                )}
                {metadata?.animation_url && (
                  <a
                    href={
                      metadata.animation_url.startsWith("ipfs://")
                        ? metadata.animation_url.replace("ipfs://", "https://ipfs.io/ipfs/")
                        : metadata.animation_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nft-link-button"
                  >
                    View Animation ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Token URI Section */}
          {tokenUri && (
            <div className="tx-details">
              <div className="tx-section">
                <span className="tx-section-title">Token URI</span>
              </div>
              <div className="nft-token-uri">
                <code className="nft-token-uri-code">{tokenUri}</code>
                {!tokenUri.startsWith("data:") && (
                  <a
                    href={
                      tokenUri.startsWith("ipfs://")
                        ? tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/")
                        : tokenUri
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nft-link-button nft-token-uri-link"
                  >
                    Open URI ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Raw Metadata Section */}
          {metadata && (
            <div className="tx-details">
              <button
                type="button"
                className="tx-section btn-toggle-section"
                onClick={() => {
                  const elem = document.getElementById("raw-metadata-content");
                  const icon = document.getElementById("raw-metadata-icon");
                  if (elem && icon) {
                    const isHidden = elem.style.display === "none";
                    elem.style.display = isHidden ? "block" : "none";
                    icon.textContent = isHidden ? "▼" : "▶";
                  }
                }}
              >
                <span className="tx-section-title">Raw Metadata</span>
                <span id="raw-metadata-icon" className="contract-section-toggle">
                  ▶
                </span>
              </button>
              <div id="raw-metadata-content" className="tx-input-data hidden">
                <code>{JSON.stringify(metadata, null, 2)}</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ERC1155TokenDetails;
