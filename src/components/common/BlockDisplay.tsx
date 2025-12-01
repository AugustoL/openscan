import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { Block, BlockArbitrum, RPCMetadata } from "../../types";
import { RPCIndicator } from "./RPCIndicator";

interface BlockDisplayProps {
  block: Block | BlockArbitrum;
  chainId?: string;
  metadata?: RPCMetadata;
  selectedProvider?: string | null;
  onProviderSelect?: (provider: string) => void;
}

const BlockDisplay: React.FC<BlockDisplayProps> = React.memo(
  ({ block, chainId, metadata, selectedProvider, onProviderSelect }) => {
    const [showWithdrawals, setShowWithdrawals] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);
    const [showMoreDetails, setShowMoreDetails] = useState(false);

    // Check if this is an Arbitrum block
    const isArbitrumBlock = (block: Block | BlockArbitrum): block is BlockArbitrum => {
      return "l1BlockNumber" in block;
    };

    // Helper to format timestamp
    const formatTimestamp = (timestamp: string) => {
      try {
        const ts = Number(timestamp);
        const date = new Date(ts * 1000);
        return new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }).format(date);
      } catch (_e) {
        return timestamp;
      }
    };

    const formatTimeAgo = (timestamp: string) => {
      const ts = Number(timestamp) * 1000;
      const diffMs = Date.now() - ts;
      const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);

      if (diffSeconds < 5) {
        return diffMs >= 0 ? "just now" : "in a few seconds";
      }

      const units = [
        { label: "day", seconds: 60 * 60 * 24 },
        { label: "hour", seconds: 60 * 60 },
        { label: "minute", seconds: 60 },
      ];

      for (const unit of units) {
        if (diffSeconds >= unit.seconds) {
          const value = Math.floor(diffSeconds / unit.seconds);
          const plural = value === 1 ? "" : "s";
          return diffMs >= 0
            ? `${value} ${unit.label}${plural} ago`
            : `in ${value} ${unit.label}${plural}`;
        }
      }

      return diffMs >= 0
        ? `${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`
        : `in ${diffSeconds} second${diffSeconds === 1 ? "" : "s"}`;
    };

    const formatGwei = (value: string) => {
      try {
        const gwei = Number(value) / 1e9;
        return `${gwei.toFixed(9)} Gwei`;
      } catch (_e) {
        return value;
      }
    };

    const formatEth = (value: string) => {
      try {
        const eth = Number(value) / 1e18;
        return `${eth.toFixed(12)} ETH`;
      } catch (_e) {
        return value;
      }
    };

    const blockNumber = Number(block.number);
    const timestampFormatted = formatTimestamp(block.timestamp);
    const timestampAge = formatTimeAgo(block.timestamp);
    const gasUsedPct = ((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(1);

    // Calculate burnt fees if baseFeePerGas exists
    const burntFees = block.baseFeePerGas
      ? (BigInt(block.gasUsed) * BigInt(block.baseFeePerGas)).toString()
      : null;

    return (
      <div className="block-display-card">
        <div
          className="block-display-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="block-label">Block Details</span>
          {metadata && selectedProvider !== undefined && onProviderSelect && (
            <RPCIndicator
              metadata={metadata}
              selectedProvider={selectedProvider}
              onProviderSelect={onProviderSelect}
            />
          )}
        </div>

        <div className="tx-details">
          {/* Block Height */}
          <div className="tx-row">
            <span className="tx-label">Block Height:</span>
            <span className="tx-value">
              <span className="block-height-value">{blockNumber.toLocaleString()}</span>
              {chainId && (
                <span className="block-nav">
                  {blockNumber > 0 && (
                    <Link
                      to={`/${chainId}/block/${blockNumber - 1}`}
                      className="block-nav-btn"
                      title="Previous block"
                    >
                      ←
                    </Link>
                  )}
                  <Link
                    to={`/${chainId}/block/${blockNumber + 1}`}
                    className="block-nav-btn"
                    title="Next block"
                  >
                    →
                  </Link>
                </span>
              )}
            </span>
          </div>

          {/* Timestamp */}
          <div className="tx-row">
            <span className="tx-label">Timestamp:</span>
            <span className="tx-value">
              <span className="tx-age">{timestampAge}</span>
              <span className="tx-timestamp-full">({timestampFormatted})</span>
            </span>
          </div>

          {/* Transactions */}
          <div className="tx-row">
            <span className="tx-label">Transactions:</span>
            <span className="tx-value">
              <span className="tx-value-highlight">
                {block.transactions ? block.transactions.length : 0} transactions
              </span>{" "}
              in this block
            </span>
          </div>

          {/* Withdrawals count */}
          {block.withdrawals && block.withdrawals.length > 0 && (
            <div className="tx-row">
              <span className="tx-label">Withdrawals:</span>
              <span className="tx-value">
                {block.withdrawals.length} withdrawal
                {block.withdrawals.length !== 1 ? "s" : ""} in this block
              </span>
            </div>
          )}

          {/* Fee Recipient (Miner) */}
          <div className="tx-row">
            <span className="tx-label">Fee Recipient:</span>
            <span className="tx-value tx-mono">
              {chainId ? (
                <Link to={`/${chainId}/address/${block.miner}`} className="link-accent">
                  {block.miner}
                </Link>
              ) : (
                block.miner
              )}
            </span>
          </div>

          {/* Gas Used */}
          <div className="tx-row">
            <span className="tx-label">Gas Used:</span>
            <span className="tx-value">
              {Number(block.gasUsed).toLocaleString()}
              <span className="tx-gas-pct"> ({gasUsedPct}%)</span>
            </span>
          </div>

          {/* Gas Limit */}
          <div className="tx-row">
            <span className="tx-label">Gas Limit:</span>
            <span className="tx-value">{Number(block.gasLimit).toLocaleString()}</span>
          </div>

          {/* Base Fee Per Gas */}
          {block.baseFeePerGas && (
            <div className="tx-row">
              <span className="tx-label">Base Fee Per Gas:</span>
              <span className="tx-value">{formatGwei(block.baseFeePerGas)}</span>
            </div>
          )}

          {/* Burnt Fees */}
          {burntFees && (
            <div className="tx-row">
              <span className="tx-label">Burnt Fees:</span>
              <span className="tx-value">
                <span className="burnt-fees">🔥 {formatEth(burntFees)}</span>
              </span>
            </div>
          )}

          {/* Extra Data */}
          {block.extraData && block.extraData !== "0x" && (
            <div className="tx-row">
              <span className="tx-label">Extra Data:</span>
              <span className="tx-value tx-mono">{block.extraData}</span>
            </div>
          )}

          {/* Difficulty */}
          {Number(block.difficulty) > 0 && (
            <div className="tx-row">
              <span className="tx-label">Difficulty:</span>
              <span className="tx-value">{Number(block.difficulty).toLocaleString()}</span>
            </div>
          )}

          {/* Total Difficulty */}
          {Number(block.totalDifficulty) > 0 && (
            <div className="tx-row">
              <span className="tx-label">Total Difficulty:</span>
              <span className="tx-value">{Number(block.totalDifficulty).toLocaleString()}</span>
            </div>
          )}

          {/* Size */}
          <div className="tx-row">
            <span className="tx-label">Size:</span>
            <span className="tx-value">{Number(block.size).toLocaleString()} bytes</span>
          </div>

          {/* Arbitrum-specific fields */}
          {isArbitrumBlock(block) && (
            <>
              <div className="tx-row tx-row-arbitrum">
                <span className="tx-label">L1 Block Number:</span>
                <span className="tx-value">{Number(block.l1BlockNumber).toLocaleString()}</span>
              </div>
              <div className="tx-row tx-row-arbitrum">
                <span className="tx-label">Send Count:</span>
                <span className="tx-value">{block.sendCount}</span>
              </div>
              <div className="tx-row tx-row-arbitrum">
                <span className="tx-label">Send Root:</span>
                <span className="tx-value tx-mono">{block.sendRoot}</span>
              </div>
            </>
          )}

          {/* More Details (collapsible) */}
          <div className="tx-row tx-row-vertical">
            {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
            <button
              className="more-details-toggle"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
            >
              {showMoreDetails ? "− Hide" : "+ Show"} More Details
            </button>

            {showMoreDetails && (
              <div className="more-details-content">
                <div className="detail-row">
                  <span className="detail-label">Hash:</span>
                  <span className="detail-value tx-mono">{block.hash}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Parent Hash:</span>
                  <span className="detail-value tx-mono">
                    {chainId &&
                    block.parentHash !==
                      "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
                      <Link to={`/${chainId}/block/${blockNumber - 1}`} className="link-accent">
                        {block.parentHash}
                      </Link>
                    ) : (
                      block.parentHash
                    )}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">State Root:</span>
                  <span className="detail-value tx-mono">{block.stateRoot}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Transactions Root:</span>
                  <span className="detail-value tx-mono">{block.transactionsRoot}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Receipts Root:</span>
                  <span className="detail-value tx-mono">{block.receiptsRoot}</span>
                </div>
                {block.withdrawalsRoot && (
                  <div className="detail-row">
                    <span className="detail-label">Withdrawals Root:</span>
                    <span className="detail-value tx-mono">{block.withdrawalsRoot}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Logs Bloom:</span>
                  <div className="detail-value">
                    <code className="logs-bloom">{block.logsBloom}</code>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Nonce:</span>
                  <span className="detail-value">{block.nonce}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Mix Hash:</span>
                  <span className="detail-value tx-mono">{block.mixHash}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Sha3 Uncles:</span>
                  <span className="detail-value tx-mono">{block.sha3Uncles}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        {block.transactions && block.transactions.length > 0 && (
          <div className="tx-section">
            <div className="tx-section-header">
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                className="tx-section-toggle"
                onClick={() => setShowTransactions(!showTransactions)}
              >
                <span className="tx-section-title">Transactions ({block.transactions.length})</span>
                <span className="tx-section-arrow">{showTransactions ? "▼" : "▶"}</span>
              </button>
            </div>
            {showTransactions && (
              <div className="tx-list">
                {block.transactions.map((txHash, index) => (
                  <div key={txHash} className="tx-list-item">
                    <span className="tx-list-index">{index}</span>
                    <span className="tx-list-hash tx-mono">
                      {chainId ? (
                        <Link to={`/${chainId}/tx/${txHash}`} className="link-accent">
                          {txHash}
                        </Link>
                      ) : (
                        txHash
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdrawals List */}
        {block.withdrawals && block.withdrawals.length > 0 && (
          <div className="tx-section">
            <div className="tx-section-header">
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                className="tx-section-toggle"
                onClick={() => setShowWithdrawals(!showWithdrawals)}
              >
                <span className="tx-section-title">Withdrawals ({block.withdrawals.length})</span>
                <span className="tx-section-arrow">{showWithdrawals ? "▼" : "▶"}</span>
              </button>
            </div>
            {showWithdrawals && (
              <div className="tx-logs">
                {block.withdrawals.map((withdrawal, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <TODO>
                  <div key={index} className="tx-log">
                    <div className="tx-log-index">{index}</div>
                    <div className="tx-log-content">
                      <div className="tx-log-row">
                        <span className="tx-log-label">Index</span>
                        <span className="tx-log-value">
                          {Number(withdrawal.index).toLocaleString()}
                        </span>
                      </div>
                      <div className="tx-log-row">
                        <span className="tx-log-label">Validator</span>
                        <span className="tx-log-value">
                          {Number(withdrawal.validatorIndex).toLocaleString()}
                        </span>
                      </div>
                      <div className="tx-log-row">
                        <span className="tx-log-label">Address</span>
                        <span className="tx-log-value tx-mono">
                          {chainId ? (
                            <Link
                              to={`/${chainId}/address/${withdrawal.address}`}
                              className="link-accent"
                            >
                              {withdrawal.address}
                            </Link>
                          ) : (
                            withdrawal.address
                          )}
                        </span>
                      </div>
                      <div className="tx-log-row">
                        <span className="tx-log-label">Amount</span>
                        <span className="tx-log-value tx-value-highlight">
                          {(Number(withdrawal.amount) / 1e9).toFixed(9)} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

BlockDisplay.displayName = "BlockDisplay";

export default BlockDisplay;
