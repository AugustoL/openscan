import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Transaction, TransactionArbitrum, TransactionReceiptArbitrum, TransactionReceiptOptimism } from '../../types';
import LongString from './LongString';
import { DataService } from '../../services/DataService';
import { TraceResult } from '../../services/EVM/L1/fetchers/trace';

interface TransactionDisplayProps {
    transaction: Transaction | TransactionArbitrum;
    chainId?: string;
    currentBlockNumber?: number;
    dataService?: DataService;
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({ transaction, chainId, currentBlockNumber, dataService }) => {
    const [showRawData, setShowRawData] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [showTrace, setShowTrace] = useState(false);
    const [traceData, setTraceData] = useState<TraceResult | null>(null);
    const [callTrace, setCallTrace] = useState<any>(null);
    const [loadingTrace, setLoadingTrace] = useState(false);

    // Check if trace is available (localhost only)
    const isTraceAvailable = dataService?.isTraceAvailable() || false;

    // Load trace data when trace section is expanded
    useEffect(() => {
        if (showTrace && isTraceAvailable && dataService && !traceData && !callTrace) {
            setLoadingTrace(true);
            Promise.all([
                dataService.getTransactionTrace(transaction.hash),
                dataService.getCallTrace(transaction.hash)
            ])
                .then(([trace, call]) => {
                    setTraceData(trace);
                    setCallTrace(call);
                })
                .catch(err => console.error('Error loading trace:', err))
                .finally(() => setLoadingTrace(false));
        }
    }, [showTrace, isTraceAvailable, dataService, transaction.hash, traceData, callTrace]);

    // Check if this is an Arbitrum transaction
    const isArbitrumTx = (tx: Transaction | TransactionArbitrum): tx is TransactionArbitrum => {
        return 'requestId' in tx;
    };

    // Check if receipt is Arbitrum receipt
    const isArbitrumReceipt = (receipt: any): receipt is TransactionReceiptArbitrum => {
        return receipt && 'l1BlockNumber' in receipt;
    };

    // Check if receipt is Optimism receipt
    const isOptimismReceipt = (receipt: any): receipt is TransactionReceiptOptimism => {
        return receipt && 'l1Fee' in receipt;
    };

    const truncate = (str: string, start = 6, end = 4) => {
        if (!str) return '';
        if (str.length <= start + end) return str;
        return `${str.slice(0, start)}...${str.slice(-end)}`;
    };

    const formatValue = (value: string) => {
        try {
            const eth = Number(value) / 1e18;
            return `${eth.toFixed(6)} ETH`;
        } catch (e) {
            return value;
        }
    };

    const formatGwei = (value: string) => {
        try {
            const gwei = Number(value) / 1e9;
            return `${gwei.toFixed(2)} Gwei`;
        } catch (e) {
            return value;
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        const isSuccess = status === '0x1' || status === '1';
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: isSuccess ? '#d1fae5' : '#fee2e2',
                color: isSuccess ? '#065f46' : '#991b1b'
            }}>
                {isSuccess ? 'Success' : 'Failed'}
            </span>
        );
    };

    return (
        <div className="block-display-card">
            <div className="block-display-header">
                <span className="block-label">Transaction:</span>
                <span className="block-number">
                    <LongString value={transaction.hash} start={10} end={8} />
                </span>
            </div>

            {/* Basic Transaction Info */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Status</span>
                    <span>{getStatusBadge(transaction.receipt?.status)}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Block</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(transaction.blockNumber).toLocaleString()}</span>
                </div>

                {currentBlockNumber && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(16, 185, 129, 0.04)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #10b981'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#10b981',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>Confirmations</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>
                            {(() => {
                                const confirmations = currentBlockNumber - Number(transaction.blockNumber);
                                return confirmations > 100 ? '+100' : confirmations.toLocaleString();
                            })()}
                        </span>
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Nonce</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{transaction.nonce}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Index</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{transaction.transactionIndex}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Type</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{transaction.type}</span>
                </div>
            </div>

            {/* Addresses */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>From</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem'
                    }}>
                        {chainId ? (
                            <Link 
                                to={`/${chainId}/address/${transaction.from}`}
                                style={{ 
                                    color: '#10b981', 
                                    fontWeight: '600',
                                    textDecoration: 'none'
                                }}
                            >
                                {truncate(transaction.from, 10, 8)}
                            </Link>
                        ) : (
                            truncate(transaction.from, 10, 8)
                        )}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>To</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem'
                    }}>
                        {transaction.to ? (
                            chainId ? (
                                <Link 
                                    to={`/${chainId}/address/${transaction.to}`}
                                    style={{ 
                                        color: '#10b981', 
                                        fontWeight: '600',
                                        textDecoration: 'none'
                                    }}
                                >
                                    {truncate(transaction.to, 10, 8)}
                                </Link>
                            ) : (
                                truncate(transaction.to, 10, 8)
                            )
                        ) : (
                            <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Contract Creation</span>
                        )}
                    </span>
                </div>

                {transaction.receipt?.contractAddress && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '10px 12px',
                        background: 'rgba(16, 185, 129, 0.04)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #10b981'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#10b981',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>Contract Address</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.9rem'
                        }}>
                            {chainId ? (
                                <Link 
                                    to={`/${chainId}/address/${transaction.receipt.contractAddress}`}
                                    style={{ 
                                        color: '#10b981', 
                                        fontWeight: '600',
                                        textDecoration: 'none'
                                    }}
                                >
                                    {truncate(transaction.receipt.contractAddress, 10, 8)}
                                </Link>
                            ) : (
                                truncate(transaction.receipt.contractAddress, 10, 8)
                            )}
                        </span>
                    </div>
                )}
            </div>

            {/* Value and Fees */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Value</span>
                    <span style={{ 
                        fontWeight: '600',
                        color: '#059669',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{formatValue(transaction.value)}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Transaction Fee</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>
                        {transaction.receipt 
                            ? formatValue((BigInt(transaction.receipt.gasUsed) * BigInt(transaction.receipt.effectiveGasPrice)).toString())
                            : 'N/A'
                        }
                    </span>
                </div>
            </div>

            {/* Gas Details */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Gas Price</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{formatGwei(transaction.gasPrice)}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <span style={{ 
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '600',
                        fontFamily: 'Outfit, sans-serif'
                    }}>Gas Limit</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(transaction.gas).toLocaleString()}</span>
                </div>

                {transaction.receipt && (
                    <>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'rgba(16, 185, 129, 0.04)',
                            borderRadius: '8px',
                            borderLeft: '3px solid #10b981'
                        }}>
                            <span style={{ 
                                fontSize: '0.85rem',
                                color: '#10b981',
                                fontWeight: '600',
                                fontFamily: 'Outfit, sans-serif'
                            }}>Gas Used</span>
                            <span style={{ 
                                fontWeight: '500',
                                color: 'var(--text-color, #1f2937)',
                                fontFamily: 'Outfit, sans-serif',
                                fontSize: '0.95rem'
                            }}>
                                {Number(transaction.receipt.gasUsed).toLocaleString()} 
                                <span style={{ color: '#6b7280', marginLeft: '4px', fontSize: '0.85rem' }}>
                                    ({((Number(transaction.receipt.gasUsed) / Number(transaction.gas)) * 100).toFixed(1)}%)
                                </span>
                            </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'rgba(16, 185, 129, 0.04)',
                            borderRadius: '8px',
                            borderLeft: '3px solid #10b981'
                        }}>
                            <span style={{ 
                                fontSize: '0.85rem',
                                color: '#10b981',
                                fontWeight: '600',
                                fontFamily: 'Outfit, sans-serif'
                            }}>Effective Gas Price</span>
                            <span style={{ 
                                fontWeight: '500',
                                color: 'var(--text-color, #1f2937)',
                                fontFamily: 'Outfit, sans-serif',
                                fontSize: '0.95rem'
                            }}>{formatGwei(transaction.receipt.effectiveGasPrice)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Arbitrum-specific fields */}
            {isArbitrumTx(transaction) && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginTop: '16px'
                }}>
                    {transaction.requestId && transaction.requestId !== '0x0' && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            padding: '10px 12px',
                            background: 'rgba(59, 130, 246, 0.08)',
                            borderRadius: '8px',
                            borderLeft: '3px solid #3b82f6',
                            gridColumn: '1 / -1'
                        }}>
                            <span style={{ 
                                fontSize: '0.85rem',
                                color: '#3b82f6',
                                fontWeight: '600',
                                fontFamily: 'Outfit, sans-serif'
                            }}>Request ID</span>
                            <span style={{ 
                                fontWeight: '500',
                                color: 'var(--text-color, #1f2937)',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all'
                            }}>{transaction.requestId}</span>
                        </div>
                    )}
                    
                    {transaction.receipt && isArbitrumReceipt(transaction.receipt) && (
                        <>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'rgba(59, 130, 246, 0.08)',
                                borderRadius: '8px',
                                borderLeft: '3px solid #3b82f6'
                            }}>
                                <span style={{ 
                                    fontSize: '0.85rem',
                                    color: '#3b82f6',
                                    fontWeight: '600',
                                    fontFamily: 'Outfit, sans-serif'
                                }}>L1 Block Number</span>
                                <span style={{ 
                                    fontWeight: '500',
                                    color: 'var(--text-color, #1f2937)',
                                    fontFamily: 'Outfit, sans-serif',
                                    fontSize: '0.95rem'
                                }}>{Number(transaction.receipt.l1BlockNumber).toLocaleString()}</span>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'rgba(59, 130, 246, 0.08)',
                                borderRadius: '8px',
                                borderLeft: '3px solid #3b82f6'
                            }}>
                                <span style={{ 
                                    fontSize: '0.85rem',
                                    color: '#3b82f6',
                                    fontWeight: '600',
                                    fontFamily: 'Outfit, sans-serif'
                                }}>Gas Used for L1</span>
                                <span style={{ 
                                    fontWeight: '500',
                                    color: 'var(--text-color, #1f2937)',
                                    fontFamily: 'Outfit, sans-serif',
                                    fontSize: '0.95rem'
                                }}>{Number(transaction.receipt.gasUsedForL1).toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Optimism-specific fields */}
            {transaction.receipt && isOptimismReceipt(transaction.receipt) && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginTop: '16px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #ef4444'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#ef4444',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>L1 Fee</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>{formatValue(transaction.receipt.l1Fee)}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #ef4444'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#ef4444',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>L1 Gas Price</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>{formatGwei(transaction.receipt.l1GasPrice)}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #ef4444'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#ef4444',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>L1 Gas Used</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>{Number(transaction.receipt.l1GasUsed).toLocaleString()}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #ef4444'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#ef4444',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>L1 Fee Scalar</span>
                        <span style={{ 
                            fontWeight: '500',
                            color: 'var(--text-color, #1f2937)',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>{transaction.receipt.l1FeeScalar}</span>
                    </div>
                </div>
            )}

            {/* Input Data Section */}
            {transaction.data && transaction.data !== '0x' && (
                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={() => setShowRawData(!showRawData)}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            marginBottom: '10px'
                        }}
                    >
                        {showRawData ? 'Hide' : 'Show'} Input Data
                    </button>
                    
                    {showRawData && (
                        <div style={{
                            background: '#f3f4f6',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            wordBreak: 'break-all',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {transaction.data}
                        </div>
                    )}
                </div>
            )}

            {/* Event Logs Section */}
            {transaction.receipt && transaction.receipt.logs.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            marginBottom: '10px'
                        }}
                    >
                        {showLogs ? 'Hide' : 'Show'} Event Logs ({transaction.receipt.logs.length})
                    </button>
                    
                    {showLogs && (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px' 
                        }}>
                            {transaction.receipt.logs.map((log: any, index: number) => (
                                <div key={index} style={{
                                    background: '#f3f4f6',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ 
                                        fontFamily: 'Outfit, sans-serif', 
                                        fontWeight: '600', 
                                        color: '#10b981',
                                        marginBottom: '10px' 
                                    }}>
                                        Log {index}
                                    </div>
                                    <div style={{ 
                                        display: 'grid', 
                                        gap: '8px',
                                        fontSize: '0.9rem'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: '600', color: '#6b7280' }}>Address: </span>
                                            {chainId ? (
                                                <Link 
                                                    to={`/${chainId}/address/${log.address}`}
                                                    style={{ 
                                                        color: '#10b981', 
                                                        fontWeight: '600',
                                                        textDecoration: 'none',
                                                        fontFamily: 'monospace'
                                                    }}
                                                >
                                                    {log.address}
                                                </Link>
                                            ) : (
                                                <span style={{ fontFamily: 'monospace' }}>{log.address}</span>
                                            )}
                                        </div>
                                        {log.topics && log.topics.length > 0 && (
                                            <div>
                                                <span style={{ fontWeight: '600', color: '#6b7280' }}>Topics:</span>
                                                {log.topics.map((topic: string, i: number) => (
                                                    <div key={i} style={{ 
                                                        fontFamily: 'monospace', 
                                                        fontSize: '0.85rem',
                                                        marginLeft: '10px'
                                                    }}>
                                                        [{i}] <LongString value={topic} start={10} end={8} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {log.data && log.data !== '0x' && (
                                            <div>
                                                <span style={{ fontWeight: '600', color: '#6b7280' }}>Data: </span>
                                                <div style={{ 
                                                    fontFamily: 'monospace', 
                                                    fontSize: '0.85rem',
                                                    marginTop: '4px'
                                                }}>
                                                    <LongString value={log.data} start={20} end={20} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Debug Trace Section (Localhost Only) */}
            {isTraceAvailable && (
                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={() => setShowTrace(!showTrace)}
                        style={{
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            marginBottom: '10px'
                        }}
                    >
                        {showTrace ? 'Hide' : 'Show'} Debug Trace
                    </button>
                    
                    {showTrace && (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '15px' 
                        }}>
                            {loadingTrace && (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                    Loading trace data...
                                </div>
                            )}

                            {/* Call Trace */}
                            {callTrace && (
                                <div style={{
                                    background: '#f3f4f6',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ 
                                        fontFamily: 'Outfit, sans-serif', 
                                        fontWeight: '600', 
                                        color: '#8b5cf6',
                                        marginBottom: '10px',
                                        fontSize: '1.1rem'
                                    }}>
                                        Call Trace
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gap: '8px',
                                        fontSize: '0.85rem',
                                        fontFamily: 'monospace'
                                    }}>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>Type:</span> {callTrace.type}</div>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>From:</span> <LongString value={callTrace.from} start={10} end={8} /></div>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>To:</span> <LongString value={callTrace.to} start={10} end={8} /></div>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>Value:</span> {callTrace.value}</div>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>Gas:</span> {callTrace.gas}</div>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>Gas Used:</span> {callTrace.gasUsed}</div>
                                        {callTrace.error && (
                                            <div style={{ color: '#ef4444' }}>
                                                <span style={{ fontWeight: '600' }}>Error:</span> {callTrace.error}
                                            </div>
                                        )}
                                        {callTrace.calls && callTrace.calls.length > 0 && (
                                            <div style={{ marginTop: '10px' }}>
                                                <div style={{ fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                                                    Internal Calls ({callTrace.calls.length}):
                                                </div>
                                                <div style={{ 
                                                    maxHeight: '300px', 
                                                    overflowY: 'auto',
                                                    background: 'rgba(0,0,0,0.02)',
                                                    padding: '10px',
                                                    borderRadius: '6px'
                                                }}>
                                                    {JSON.stringify(callTrace.calls, null, 2)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Opcode Trace */}
                            {traceData && (
                                <div style={{
                                    background: '#f3f4f6',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ 
                                        fontFamily: 'Outfit, sans-serif', 
                                        fontWeight: '600', 
                                        color: '#8b5cf6',
                                        marginBottom: '10px',
                                        fontSize: '1.1rem'
                                    }}>
                                        Execution Trace
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gap: '8px',
                                        fontSize: '0.85rem',
                                        marginBottom: '15px'
                                    }}>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>Total Gas Used:</span> {traceData.gas}</div>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>Failed:</span> {traceData.failed ? 'Yes' : 'No'}</div>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>Return Value:</span> <LongString value={traceData.returnValue || '0x'} start={20} end={20} /></div>
                                        <div><span style={{ fontWeight: '600', color: '#6b7280' }}>Opcodes Executed:</span> {traceData.structLogs.length}</div>
                                    </div>
                                    
                                    <div style={{ 
                                        fontWeight: '600', 
                                        color: '#6b7280',
                                        marginBottom: '10px'
                                    }}>
                                        Opcode Execution Log:
                                    </div>
                                    <div style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        background: 'rgba(0,0,0,0.02)',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        fontFamily: 'monospace',
                                        fontSize: '0.75rem'
                                    }}>
                                        {traceData.structLogs.slice(0, 100).map((log, index) => (
                                            <div key={index} style={{ 
                                                marginBottom: '8px',
                                                paddingBottom: '8px',
                                                borderBottom: '1px solid #e5e7eb'
                                            }}>
                                                <div style={{ color: '#8b5cf6', fontWeight: '600' }}>
                                                    Step {index}: {log.op}
                                                </div>
                                                <div style={{ marginLeft: '10px', color: '#6b7280' }}>
                                                    PC: {log.pc} | Gas: {log.gas} | Cost: {log.gasCost} | Depth: {log.depth}
                                                </div>
                                                {log.stack && log.stack.length > 0 && (
                                                    <div style={{ marginLeft: '10px', fontSize: '0.7rem', color: '#9ca3af' }}>
                                                        Stack: [{log.stack.slice(0, 3).join(', ')}{log.stack.length > 3 ? '...' : ''}]
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {traceData.structLogs.length > 100 && (
                                            <div style={{ textAlign: 'center', color: '#6b7280', padding: '10px' }}>
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
};

export default TransactionDisplay;
