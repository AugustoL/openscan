import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Transaction } from '../../types';
import LongString from './LongString';

interface TransactionDisplayProps {
    transaction: Transaction;
    chainId?: string;
    currentBlockNumber?: number;
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({ transaction, chainId, currentBlockNumber }) => {
    const [showRawData, setShowRawData] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

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
        </div>
    );
};

export default TransactionDisplay;
