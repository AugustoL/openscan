import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context";
import { useSourcify } from "../../hooks/useSourcify";
import type { DataService } from "../../services/DataService";
import type { TraceResult } from "../../services/EVM/L1/fetchers/trace";
import type {
  RPCMetadata,
  Transaction,
  TransactionArbitrum,
  TransactionReceiptArbitrum,
  TransactionReceiptOptimism,
} from "../../types";
import {
  type DecodedEvent,
  decodeEventLog,
  formatDecodedValue,
  getEventTypeColor,
} from "../../utils/eventDecoder";
import {
  type DecodedInput,
  decodeEventWithAbi,
  decodeFunctionCall,
} from "../../utils/inputDecoder";
import LongString from "./LongString";
import { RPCIndicator } from "./RPCIndicator";

interface TransactionDisplayProps {
  transaction: Transaction | TransactionArbitrum;
  chainId?: string;
  currentBlockNumber?: number;
  dataService?: DataService;
  metadata?: RPCMetadata;
  selectedProvider?: string | null;
  onProviderSelect?: (provider: string) => void;
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = React.memo(
  ({
    transaction,
    chainId,
    currentBlockNumber,
    dataService,
    metadata,
    selectedProvider,
    onProviderSelect,
  }) => {
    const [_showRawData, _setShowRawData] = useState(false);
    const [_showLogs, _setShowLogs] = useState(false);
    const [showTrace, setShowTrace] = useState(false);
    const [traceData, setTraceData] = useState<TraceResult | null>(null);
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const [callTrace, setCallTrace] = useState<any>(null);
    const [loadingTrace, setLoadingTrace] = useState(false);
    const [_copiedField, _setCopiedField] = useState<string | null>(null);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get local artifacts from context
    const { jsonFiles } = useContext(AppContext);

    // Check if we have local artifact data for the recipient address
    const localArtifact = transaction.to ? jsonFiles[transaction.to.toLowerCase()] : null;

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
            ? {
                version: localArtifact.buildInfo.solcVersion,
              }
            : undefined,
        },
        match: "perfect" as const,
        creation_match: null,
        runtime_match: null,
        chainId: chainId,
        address: transaction.to,
        verifiedAt: undefined,
      };
    }, [localArtifact, chainId, transaction.to]);

    // Fetch Sourcify data for the recipient contract
    const { data: sourcifyData, isVerified } = useSourcify(
      Number(chainId),
      transaction.to || undefined,
      true,
    );

    // Use local artifact data if available and sourcify is not verified, otherwise use sourcify
    const contractData = useMemo(
      () => (isVerified && sourcifyData ? sourcifyData : parsedLocalData),
      [isVerified, sourcifyData, parsedLocalData],
    );

    // Decode input data if contract data is available
    const decodedInput: DecodedInput | null = useMemo(() => {
      if (!contractData?.abi || !transaction.data) return null;
      return decodeFunctionCall(transaction.data, contractData.abi);
    }, [contractData?.abi, transaction.data]);

    // Check if trace is available (localhost only)
    const isTraceAvailable = dataService?.isTraceAvailable() || false;

    // Load trace data when trace section is expanded
    useEffect(() => {
      if (showTrace && isTraceAvailable && dataService && !traceData && !callTrace) {
        setLoadingTrace(true);
        Promise.all([
          dataService.getTransactionTrace(transaction.hash),
          dataService.getCallTrace(transaction.hash),
        ])
          .then(([trace, call]) => {
            setTraceData(trace);
            setCallTrace(call);
          })
          .catch((err) => console.error("Error loading trace:", err))
          .finally(() => setLoadingTrace(false));
      }
    }, [showTrace, isTraceAvailable, dataService, transaction.hash, traceData, callTrace]);

    useEffect(() => {
      return () => {
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
      };
    }, []);

    // Check if this is an Arbitrum transaction
    const isArbitrumTx = useCallback(
      (tx: Transaction | TransactionArbitrum): tx is TransactionArbitrum => {
        return "requestId" in tx;
      },
      [],
    );

    // Check if receipt is Arbitrum receipt
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const isArbitrumReceipt = useCallback((receipt: any): receipt is TransactionReceiptArbitrum => {
      return receipt && "l1BlockNumber" in receipt;
    }, []);

    // Check if receipt is Optimism receipt
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    const isOptimismReceipt = useCallback((receipt: any): receipt is TransactionReceiptOptimism => {
      return receipt && "l1Fee" in receipt;
    }, []);

    const _truncate = useCallback((str: string, start = 6, end = 4) => {
      if (!str) return "";
      if (str.length <= start + end) return str;
      return `${str.slice(0, start)}...${str.slice(-end)}`;
    }, []);

    const formatValue = useCallback((value: string) => {
      try {
        const eth = Number(value) / 1e18;
        return `${eth.toFixed(6)} ETH`;
      } catch (_e) {
        return value;
      }
    }, []);

    const formatGwei = useCallback((value: string) => {
      try {
        const gwei = Number(value) / 1e9;
        return `${gwei.toFixed(2)} Gwei`;
      } catch (_e) {
        return value;
      }
    }, []);

    const parseTimestampToMs = useCallback((timestamp?: string) => {
      if (!timestamp) return null;
      const parsed = parseInt(timestamp, timestamp.startsWith("0x") ? 16 : 10);
      if (Number.isNaN(parsed)) return null;
      return parsed * 1000;
    }, []);

    const formatAbsoluteTimestamp = useCallback((timestampMs: number) => {
      try {
        return new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }).format(new Date(timestampMs));
      } catch (_error) {
        return new Date(timestampMs).toISOString();
      }
    }, []);

    const formatTimeAgo = useCallback((timestampMs: number) => {
      const diffMs = Date.now() - timestampMs;
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
    }, []);

    const timestampMs = useMemo(
      () => parseTimestampToMs(transaction.timestamp),
      [parseTimestampToMs, transaction.timestamp],
    );
    const formattedTimestamp = useMemo(
      () => (timestampMs ? formatAbsoluteTimestamp(timestampMs) : null),
      [timestampMs, formatAbsoluteTimestamp],
    );
    const timestampAge = useMemo(
      () => (timestampMs ? formatTimeAgo(timestampMs) : null),
      [timestampMs, formatTimeAgo],
    );

    const getStatusBadge = useCallback((status?: string) => {
      if (!status) return null;
      const isSuccess = status === "0x1" || status === "1";
      return (
        <span
          className={`status-badge ${isSuccess ? "status-badge-success" : "status-badge-failed"}`}
        >
          {isSuccess ? "Success" : "Failed"}
        </span>
      );
    }, []);

    const confirmations = useMemo(
      () => (currentBlockNumber ? currentBlockNumber - Number(transaction.blockNumber) : null),
      [currentBlockNumber, transaction.blockNumber],
    );

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
          <span className="block-label">Transaction Details</span>
          {metadata && selectedProvider !== undefined && onProviderSelect && (
            <RPCIndicator
              metadata={metadata}
              selectedProvider={selectedProvider}
              onProviderSelect={onProviderSelect}
            />
          )}
        </div>

        {/* Row-based layout like Etherscan */}
        <div className="tx-details">
          {/* Transaction Hash */}
          <div className="tx-row">
            <span className="tx-label">Transaction Hash:</span>
            <span className="tx-value tx-mono">
              <LongString value={transaction.hash} start={20} end={16} />
            </span>
          </div>

          {/* Status */}
          <div className="tx-row">
            <span className="tx-label">Status:</span>
            <span className="tx-value">{getStatusBadge(transaction.receipt?.status)}</span>
          </div>

          {/* Block */}
          <div className="tx-row">
            <span className="tx-label">Block:</span>
            <span className="tx-value">
              {chainId ? (
                <Link to={`/${chainId}/block/${transaction.blockNumber}`} className="link-accent">
                  {Number(transaction.blockNumber).toLocaleString()}
                </Link>
              ) : (
                Number(transaction.blockNumber).toLocaleString()
              )}
              {confirmations !== null && (
                <span className="tx-confirmations">
                  {confirmations > 100 ? "+100" : confirmations.toLocaleString()} Block
                  Confirmations
                </span>
              )}
            </span>
          </div>

          {/* Timestamp */}
          {formattedTimestamp && (
            <div className="tx-row">
              <span className="tx-label">Timestamp:</span>
              <span className="tx-value">
                {timestampAge && <span className="tx-age">{timestampAge}</span>}
                <span className="tx-timestamp-full">({formattedTimestamp})</span>
              </span>
            </div>
          )}

          {/* From */}
          <div className="tx-row">
            <span className="tx-label">From:</span>
            <span className="tx-value tx-mono">
              {chainId ? (
                <Link to={`/${chainId}/address/${transaction.from}`} className="link-accent">
                  {transaction.from}
                </Link>
              ) : (
                transaction.from
              )}
            </span>
          </div>

          {/* To */}
          <div className="tx-row">
            <span className="tx-label">{transaction.to ? "To:" : "Interacted With:"}</span>
            <span className="tx-value tx-mono">
              {transaction.to ? (
                chainId ? (
                  <Link to={`/${chainId}/address/${transaction.to}`} className="link-accent">
                    {transaction.to}
                  </Link>
                ) : (
                  transaction.to
                )
              ) : (
                <span className="contract-creation-badge">Contract Creation</span>
              )}
            </span>
          </div>

          {/* Contract Address (if created) */}
          {transaction.receipt?.contractAddress && (
            <div className="tx-row">
              <span className="tx-label">Contract Created:</span>
              <span className="tx-value tx-mono">
                {chainId ? (
                  <Link
                    to={`/${chainId}/address/${transaction.receipt.contractAddress}`}
                    className="link-accent"
                  >
                    {transaction.receipt.contractAddress}
                  </Link>
                ) : (
                  transaction.receipt.contractAddress
                )}
              </span>
            </div>
          )}

          {/* Value */}
          <div className="tx-row">
            <span className="tx-label">Value:</span>
            <span className="tx-value tx-value-highlight">{formatValue(transaction.value)}</span>
          </div>

          {/* Transaction Fee */}
          <div className="tx-row">
            <span className="tx-label">Transaction Fee:</span>
            <span className="tx-value">
              {transaction.receipt
                ? formatValue(
                    (
                      BigInt(transaction.receipt.gasUsed) *
                      BigInt(transaction.receipt.effectiveGasPrice)
                    ).toString(),
                  )
                : "Pending"}
            </span>
          </div>

          {/* Gas Price */}
          <div className="tx-row">
            <span className="tx-label">Gas Price:</span>
            <span className="tx-value">{formatGwei(transaction.gasPrice)}</span>
          </div>

          {/* Gas Limit & Usage */}
          <div className="tx-row">
            <span className="tx-label">Gas Limit & Usage:</span>
            <span className="tx-value">
              {Number(transaction.gas).toLocaleString()}
              {transaction.receipt && (
                <>
                  {" | "}
                  {Number(transaction.receipt.gasUsed).toLocaleString()}
                  <span className="tx-gas-pct">
                    (
                    {(
                      (Number(transaction.receipt.gasUsed) / Number(transaction.gas)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Effective Gas Price (if different from gas price) */}
          {transaction.receipt &&
            transaction.receipt.effectiveGasPrice !== transaction.gasPrice && (
              <div className="tx-row">
                <span className="tx-label">Effective Gas Price:</span>
                <span className="tx-value">
                  {formatGwei(transaction.receipt.effectiveGasPrice)}
                </span>
              </div>
            )}

          {/* Arbitrum-specific fields */}
          {isArbitrumTx(transaction) &&
            transaction.receipt &&
            isArbitrumReceipt(transaction.receipt) && (
              <>
                <div className="tx-row tx-row-arbitrum">
                  <span className="tx-label">L1 Block Number:</span>
                  <span className="tx-value">
                    {Number(transaction.receipt.l1BlockNumber).toLocaleString()}
                  </span>
                </div>
                <div className="tx-row tx-row-arbitrum">
                  <span className="tx-label">Gas Used for L1:</span>
                  <span className="tx-value">
                    {Number(transaction.receipt.gasUsedForL1).toLocaleString()}
                  </span>
                </div>
              </>
            )}

          {/* OP Stack fields (Optimism, Base) */}
          {transaction.receipt && isOptimismReceipt(transaction.receipt) && (
            <>
              <div className={`tx-row ${chainId === "8453" ? "tx-row-base" : "tx-row-optimism"}`}>
                <span className="tx-label">L1 Fee:</span>
                <span className="tx-value">{formatValue(transaction.receipt.l1Fee)}</span>
              </div>
              <div className={`tx-row ${chainId === "8453" ? "tx-row-base" : "tx-row-optimism"}`}>
                <span className="tx-label">L1 Gas Price:</span>
                <span className="tx-value">{formatGwei(transaction.receipt.l1GasPrice)}</span>
              </div>
              <div className={`tx-row ${chainId === "8453" ? "tx-row-base" : "tx-row-optimism"}`}>
                <span className="tx-label">L1 Gas Used:</span>
                <span className="tx-value">
                  {Number(transaction.receipt.l1GasUsed).toLocaleString()}
                </span>
              </div>
              <div className={`tx-row ${chainId === "8453" ? "tx-row-base" : "tx-row-optimism"}`}>
                <span className="tx-label">L1 Fee Scalar:</span>
                <span className="tx-value">{transaction.receipt.l1FeeScalar}</span>
              </div>
            </>
          )}

          {/* Other Attributes (Nonce, Index, Type) */}
          <div className="tx-row">
            <span className="tx-label">Other Attributes:</span>
            <span className="tx-value tx-attrs">
              <span className="tx-attr">Nonce: {transaction.nonce}</span>
              <span className="tx-attr">Position: {transaction.transactionIndex}</span>
              <span className="tx-attr">Type: {transaction.type}</span>
            </span>
          </div>

          {/* Input Data */}
          <div className="tx-row tx-row-vertical">
            <span className="tx-label">Input Data:</span>
            {transaction.data && transaction.data !== "0x" ? (
              <div className="tx-input-data">
                <code>{transaction.data}</code>
              </div>
            ) : (
              <span className="tx-empty">0x</span>
            )}
          </div>

          {/* Decoded Input Data */}
          {decodedInput && (
            <div className="tx-row tx-row-vertical">
              <span className="tx-label">Decoded Input:</span>
              <div className="tx-decoded-input">
                <div className="tx-decoded-function">
                  <span className="tx-function-badge">{decodedInput.functionName}</span>
                  <span className="tx-function-signature">{decodedInput.signature}</span>
                </div>
                {decodedInput.params.length > 0 && (
                  <div className="tx-decoded-params">
                    {decodedInput.params.map((param, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: params have stable order
                      <div key={i} className="tx-decoded-param">
                        <span className="tx-param-name">{param.name}</span>
                        <span className="tx-param-type">({param.type})</span>
                        <span
                          className={`tx-param-value ${param.type === "address" ? "tx-mono" : ""}`}
                        >
                          {param.type === "address" && chainId ? (
                            <Link to={`/${chainId}/address/${param.value}`} className="link-accent">
                              {param.value}
                            </Link>
                          ) : (
                            formatDecodedValue(param.value, param.type)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Event Logs Section - Always visible */}
        {transaction.receipt && transaction.receipt.logs.length > 0 && (
          <div className="tx-section">
            <div className="tx-section-header">
              <span className="tx-section-title">
                Event Logs ({transaction.receipt.logs.length})
              </span>
            </div>
            <div className="tx-logs">
              {/** biome-ignore lint/suspicious/noExplicitAny: <TODO> */}
              {transaction.receipt.logs.map((log: any, index: number) => {
                // Try ABI-based decoding first if log is from tx.to and we have contract data
                let decoded: DecodedEvent | null = null;
                let abiDecoded: DecodedInput | null = null;

                const isFromTxRecipient =
                  transaction.to &&
                  log.address &&
                  log.address.toLowerCase() === transaction.to.toLowerCase();

                if (isFromTxRecipient && contractData?.abi && log.topics) {
                  abiDecoded = decodeEventWithAbi(log.topics, log.data || "0x", contractData.abi);
                }

                // Fallback to standard event lookup
                if (!abiDecoded && log.topics) {
                  decoded = decodeEventLog(log.topics, log.data || "0x");
                }

                // Determine which decoded data to display
                const hasDecoded = abiDecoded || decoded;
                const displayName = abiDecoded?.functionName || decoded?.name;
                const displaySignature = abiDecoded?.signature || decoded?.fullSignature;
                const displayParams = abiDecoded?.params || decoded?.params || [];

                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <TODO>
                  <div key={index} className="tx-log">
                    <div className="tx-log-index">{index}</div>
                    <div className="tx-log-content">
                      {/* Decoded Event Header */}
                      {hasDecoded && (
                        <div className="tx-log-decoded">
                          <span
                            className="tx-event-badge"
                            style={{
                              backgroundColor: abiDecoded
                                ? "#10b981"
                                : getEventTypeColor(decoded?.type || ""),
                            }}
                          >
                            {displayName}
                          </span>
                          <span
                            className="tx-event-signature"
                            title={decoded?.description || displaySignature}
                          >
                            {displaySignature}
                          </span>
                          {abiDecoded && (
                            <span className="tx-abi-badge" title="Decoded using contract ABI">
                              ABI
                            </span>
                          )}
                        </div>
                      )}

                      {/* Address */}
                      <div className="tx-log-row">
                        <span className="tx-log-label">Address</span>
                        <span className="tx-log-value tx-mono">
                          {chainId ? (
                            <Link to={`/${chainId}/address/${log.address}`} className="link-accent">
                              {log.address}
                            </Link>
                          ) : (
                            log.address
                          )}
                        </span>
                      </div>

                      {/* Decoded Parameters */}
                      {displayParams.length > 0 && (
                        <div className="tx-log-row tx-log-params">
                          <span className="tx-log-label">Decoded</span>
                          <div className="tx-log-value">
                            {displayParams.map((param, i) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: <TODO>
                              <div key={i} className="tx-decoded-param">
                                <span className="tx-param-name">{param.name}</span>
                                <span className="tx-param-type">({param.type})</span>
                                <span
                                  className={`tx-param-value ${param.type === "address" ? "tx-mono" : ""}`}
                                >
                                  {param.type === "address" && chainId ? (
                                    <Link
                                      to={`/${chainId}/address/${param.value}`}
                                      className="link-accent"
                                    >
                                      {param.value}
                                    </Link>
                                  ) : (
                                    formatDecodedValue(param.value, param.type)
                                  )}
                                </span>
                                {param.indexed && <span className="tx-param-indexed">indexed</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw Topics (collapsed if decoded) */}
                      {log.topics && log.topics.length > 0 && (
                        <div className="tx-log-row tx-log-topics">
                          <span className="tx-log-label">
                            {hasDecoded ? "Raw Topics" : "Topics"}
                          </span>
                          <div className="tx-log-value">
                            {log.topics.map((topic: string, i: number) => (
                              <div key={topic} className="tx-topic">
                                <span className="tx-topic-index">[{i}]</span>
                                <code className="tx-topic-value">{topic}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw Data */}
                      {log.data && log.data !== "0x" && (
                        <div className="tx-log-row">
                          <span className="tx-log-label">{hasDecoded ? "Raw Data" : "Data"}</span>
                          <div className="tx-log-value">
                            <code className="tx-log-data">{log.data}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Debug Trace Section (Localhost Only) */}
        {isTraceAvailable && (
          <div className="collapsible-container">
            {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
            <button className="collapsible-button-purple" onClick={() => setShowTrace(!showTrace)}>
              {showTrace ? "Hide" : "Show"} Debug Trace
            </button>

            {showTrace && (
              <div className="collapsible-content">
                {loadingTrace && <div className="trace-loading">Loading trace data...</div>}

                {/* Call Trace */}
                {callTrace && (
                  <div className="trace-container">
                    <div className="trace-title">Call Trace</div>
                    <div className="trace-details">
                      <div>
                        <span className="log-label">Type:</span> {callTrace.type}
                      </div>
                      <div>
                        <span className="log-label">From:</span>{" "}
                        <LongString value={callTrace.from} start={10} end={8} />
                      </div>
                      <div>
                        <span className="log-label">To:</span>{" "}
                        <LongString value={callTrace.to} start={10} end={8} />
                      </div>
                      <div>
                        <span className="log-label">Value:</span> {callTrace.value}
                      </div>
                      <div>
                        <span className="log-label">Gas:</span> {callTrace.gas}
                      </div>
                      <div>
                        <span className="log-label">Gas Used:</span> {callTrace.gasUsed}
                      </div>
                      {callTrace.error && (
                        <div className="trace-error">
                          <span className="log-label">Error:</span> {callTrace.error}
                        </div>
                      )}
                      {callTrace.calls && callTrace.calls.length > 0 && (
                        <div className="margin-top-10">
                          <div className="trace-calls-header">
                            Internal Calls ({callTrace.calls.length}):
                          </div>
                          <div className="trace-calls-container">
                            {JSON.stringify(callTrace.calls, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Opcode Trace */}
                {traceData && (
                  <div className="trace-container">
                    <div className="trace-title">Execution Trace</div>
                    <div className="trace-details margin-bottom-15">
                      <div>
                        <span className="log-label">Total Gas Used:</span> {traceData.gas}
                      </div>
                      <div>
                        <span className="log-label">Failed:</span> {traceData.failed ? "Yes" : "No"}
                      </div>
                      <div>
                        <span className="log-label">Return Value:</span>{" "}
                        <LongString value={traceData.returnValue || "0x"} start={20} end={20} />
                      </div>
                      <div>
                        <span className="log-label">Opcodes Executed:</span>{" "}
                        {traceData.structLogs.length}
                      </div>
                    </div>

                    <div className="trace-opcode-header">Opcode Execution Log:</div>
                    <div className="trace-opcode-container">
                      {traceData.structLogs.slice(0, 100).map((log, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: <TODO>
                        <div key={index} className="trace-opcode-step">
                          <div className="trace-opcode-name">
                            Step {index}: {log.op}
                          </div>
                          <div className="trace-opcode-info">
                            PC: {log.pc} | Gas: {log.gas} | Cost: {log.gasCost} | Depth: {log.depth}
                          </div>
                          {log.stack && log.stack.length > 0 && (
                            <div className="trace-opcode-stack">
                              Stack: [{log.stack.slice(0, 3).join(", ")}
                              {log.stack.length > 3 ? "..." : ""}]
                            </div>
                          )}
                        </div>
                      ))}
                      {traceData.structLogs.length > 100 && (
                        <div className="trace-more-text">
                          ... showing first 100 of {traceData.structLogs.length} steps
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

TransactionDisplay.displayName = "TransactionDisplay";

export default TransactionDisplay;
