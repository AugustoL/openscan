import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Transaction } from '../../types';

interface TransactionDisplayProps {
    transaction: Transaction;
    chainId?: string;
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({ transaction, chainId }) => {
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
                <span className="block-number">{truncate(transaction.hash, 10, 8)}</span>
            </div>

            {/* Basic Transaction Info */}
            <div className="block-display-grid">
                <div className="block-detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">{getStatusBadge(transaction.receipt?.status)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Block Number</span>
                    <span className="detail-value">{Number(transaction.blockNumber).toLocaleString()}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">From</span>
                    <span className="detail-value" title={transaction.from}>
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

                <div className="block-detail-item">
                    <span className="detail-label">To</span>
                    <span className="detail-value" title={transaction.to}>
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
                            'Contract Creation'
                        )}
                    </span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Value</span>
                    <span className="detail-value">{formatValue(transaction.value)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Transaction Fee</span>
                    <span className="detail-value">
                        {transaction.receipt 
                            ? formatValue((BigInt(transaction.receipt.gasUsed) * BigInt(transaction.receipt.effectiveGasPrice)).toString())
                            : 'N/A'
                        }
                    </span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Gas Price</span>
                    <span className="detail-value">{formatGwei(transaction.gasPrice)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Gas Limit</span>
                    <span className="detail-value">{Number(transaction.gas).toLocaleString()}</span>
                </div>

                {transaction.receipt && (
                    <>
                        <div className="block-detail-item">
                            <span className="detail-label">Gas Used</span>
                            <span className="detail-value">
                                {Number(transaction.receipt.gasUsed).toLocaleString()} 
                                <span style={{ color: '#6b7280', marginLeft: '4px' }}>
                                    ({((Number(transaction.receipt.gasUsed) / Number(transaction.gas)) * 100).toFixed(2)}%)
                                </span>
                            </span>
                        </div>

                        <div className="block-detail-item">
                            <span className="detail-label">Effective Gas Price</span>
                            <span className="detail-value">{formatGwei(transaction.receipt.effectiveGasPrice)}</span>
                        </div>
                    </>
                )}

                <div className="block-detail-item">
                    <span className="detail-label">Nonce</span>
                    <span className="detail-value">{transaction.nonce}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Transaction Index</span>
                    <span className="detail-value">{transaction.transactionIndex}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{transaction.type}</span>
                </div>

                {transaction.receipt?.contractAddress && (
                    <div className="block-detail-item">
                        <span className="detail-label">Contract Address</span>
                        <span className="detail-value" title={transaction.receipt.contractAddress}>
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
                                                        marginLeft: '10px',
                                                        wordBreak: 'break-all'
                                                    }}>
                                                        [{i}] {topic}
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
                                                    wordBreak: 'break-all',
                                                    marginTop: '4px'
                                                }}>
                                                    {log.data}
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
