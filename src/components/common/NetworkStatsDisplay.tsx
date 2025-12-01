import React from "react";
import type { NetworkStats, RPCMetadata } from "../../types";
import { RPCIndicator } from "./RPCIndicator";

interface NetworkStatsDisplayProps {
  networkStats: NetworkStats | null;
  loading?: boolean;
  error?: string | null;
  chainId?: number;
  metadata?: RPCMetadata;
  selectedProvider?: string | null;
  onProviderSelect?: (provider: string) => void;
}

const NetworkStatsDisplay: React.FC<NetworkStatsDisplayProps> = React.memo(
  ({
    networkStats,
    loading = false,
    error = null,
    chainId,
    metadata,
    selectedProvider,
    onProviderSelect,
  }) => {
    if (loading) {
      return (
        <div className="container-wide network-stats-container">
          <div className="block-display-card">
            <div className="text-center network-stats-loading">Loading network statistics...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="container-wide network-stats-container">
          <div className="block-display-card">
            <div className="text-center network-stats-error">
              Error loading network stats: {error}
            </div>
          </div>
        </div>
      );
    }

    if (!networkStats) {
      return null;
    }

    // Format gas price from Wei to Gwei
    const formatGasPrice = (weiPrice: string): string => {
      try {
        const gwei = Number(weiPrice) / 1e9;
        return `${gwei.toFixed(2)} Gwei`;
      } catch {
        return weiPrice;
      }
    };

    // Format block number with commas
    const formatBlockNumber = (blockNumber: string): string => {
      try {
        return Number(blockNumber).toLocaleString();
      } catch {
        return blockNumber;
      }
    };

    // Parse protocol version from metadata (localhost/Hardhat only)
    const getProtocolVersion = (): string | null => {
      if (chainId !== 31337 || !networkStats.metadata) {
        return null;
      }

      try {
        return networkStats.metadata.clientVersion || null;
      } catch (err) {
        console.error("Failed to parse metadata:", err);
        return null;
      }
    };

    // Get forked network info (localhost/Hardhat only)
    const getForkedNetworkInfo = (): {
      chainId: number;
      blockNumber: number;
      blockHash: string;
    } | null => {
      if (chainId !== 31337 || !networkStats.metadata || !networkStats.metadata.forkedNetwork) {
        return null;
      }

      try {
        const forked = networkStats.metadata.forkedNetwork;
        return {
          chainId: forked.chainId,
          blockNumber: forked.forkBlockNumber,
          blockHash: forked.forkBlockHash,
        };
      } catch (err) {
        console.error("Failed to parse forked network info:", err);
        return null;
      }
    };

    const protocolVersion = getProtocolVersion();
    const forkedNetwork = getForkedNetworkInfo();

    return (
      <div className="container-wide network-stats-container">
        <div className="block-display-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 className="network-stats-title" style={{ margin: 0 }}>
              Network Statistics
            </h2>
            {metadata && selectedProvider !== undefined && onProviderSelect && (
              <RPCIndicator
                metadata={metadata}
                selectedProvider={selectedProvider}
                onProviderSelect={onProviderSelect}
              />
            )}
          </div>

          <div className="data-grid-3">
            <div className="block-detail-item">
              <span className="detail-label">Current Gas Price</span>
              <span className="detail-value">{formatGasPrice(networkStats.currentGasPrice)}</span>
            </div>

            <div className="block-detail-item">
              <span className="detail-label">Current Block Number</span>
              <span className="detail-value">
                {formatBlockNumber(networkStats.currentBlockNumber)}
              </span>
            </div>

            <div className="block-detail-item">
              <span className="detail-label">Sync Status</span>
              <span className="detail-value">
                <span className="sync-status-indicator">
                  <span
                    className={`sync-dot ${networkStats.isSyncing ? "sync-dot-warning" : "sync-dot-success"}`}
                  />
                  {networkStats.isSyncing ? "Syncing" : "Synced"}
                </span>
              </span>
            </div>

            {networkStats.clientVersion && (
              <div className="block-detail-item network-stat-full-width">
                <span className="detail-label">Client Version</span>
                <span className="detail-value tx-mono">{networkStats.clientVersion}</span>
              </div>
            )}

            {protocolVersion && (
              <div className="block-detail-item">
                <span className="detail-label">Protocol Version</span>
                <span className="detail-value">{protocolVersion}</span>
              </div>
            )}

            {forkedNetwork && (
              <>
                <div className="block-detail-item">
                  <span className="detail-label">Forked Network</span>
                  <span className="detail-value">Chain ID: {forkedNetwork.chainId}</span>
                </div>

                <div className="block-detail-item">
                  <span className="detail-label">Fork Block Number</span>
                  <span className="detail-value">
                    {formatBlockNumber(forkedNetwork.blockNumber.toString())}
                  </span>
                </div>

                <div className="block-detail-item network-stat-full-width">
                  <span className="detail-label">Fork Block Hash</span>
                  <span className="detail-value tx-mono fork-hash-value">
                    {forkedNetwork.blockHash}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
);

NetworkStatsDisplay.displayName = "NetworkStatsDisplay";

export default NetworkStatsDisplay;
