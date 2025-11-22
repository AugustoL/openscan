import React from 'react';
import { NetworkStats } from '../../types';

interface NetworkStatsDisplayProps {
  networkStats: NetworkStats | null;
  loading?: boolean;
  error?: string | null;
}

const NetworkStatsDisplay: React.FC<NetworkStatsDisplayProps> = ({
  networkStats,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '40px auto 0', padding: '0 24px' }}>
        <div className="block-display-card">
          <div style={{ textAlign: 'center', padding: '20px', color: '#10b981' }}>
            Loading network statistics...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1400px', margin: '40px auto 0', padding: '0 24px' }}>
        <div className="block-display-card">
          <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
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

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto 0', padding: '0 24px' }}>
      <div className="block-display-card">
        <h2
          style={{
            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
            fontWeight: '600',
            color: '#10b981',
            marginBottom: '20px',
            fontFamily: "'Outfit', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Network Statistics
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '16px',
          }}
        >
          <div className="block-detail-item">
            <span className="detail-label">Current Gas Price</span>
            <span className="detail-value">
              {formatGasPrice(networkStats.currentGasPrice)}
            </span>
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
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: networkStats.isSyncing ? '#f59e0b' : '#10b981',
                    display: 'inline-block',
                  }}
                />
                {networkStats.isSyncing ? 'Syncing' : 'Synced'}
              </span>
            </span>
          </div>

          <div className="block-detail-item">
            <span className="detail-label">Hash Rate</span>
            <span className="detail-value">{networkStats.hashRate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatsDisplay;
