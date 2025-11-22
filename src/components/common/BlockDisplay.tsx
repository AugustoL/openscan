import React from 'react';
import { Link } from 'react-router-dom';
import { Block } from '../../types';

interface BlockDisplayProps {
    block: Block;
    chainId?: string;
}

const BlockDisplay: React.FC<BlockDisplayProps> = ({ block, chainId }) => {
    // Helper to truncate long hashes
    const truncate = (str: string, start = 6, end = 4) => {
        if (!str) return '';
        if (str.length <= start + end) return str;
        return `${str.slice(0, start)}...${str.slice(-end)}`;
    };

    // Helper to format timestamp
    const formatTime = (timestamp: string) => {
        try {
            // Assuming timestamp is in seconds (standard for ETH)
            const date = new Date(Number(timestamp) * 1000);
            return date.toLocaleString();
        } catch (e) {
            return timestamp;
        }
    };

    return (
        <div className="block-display-card">
            <div className="block-display-header">
                <span className="block-label">Block:</span>
                <span className="block-number">{Number(block.number).toLocaleString()}</span>
            </div>

            {/* Basic Info */}
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
                    }}>Timestamp</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{formatTime(block.timestamp)}</span>
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
                    }}>Transactions</span>
                    <span style={{ 
                        fontWeight: '600',
                        color: '#059669',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{block.transactions ? block.transactions.length : 0}</span>
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
                    }}>Uncles</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{block.uncles ? block.uncles.length : 0}</span>
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
                    }}>Size</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.size).toLocaleString()} bytes</span>
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
                    }}>Nonce</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{block.nonce}</span>
                </div>
            </div>

            {/* Hashes */}
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
                    }}>Hash</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.hash}>{truncate(block.hash, 10, 8)}</span>
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
                    }}>Parent Hash</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem'
                    }}>
                        {chainId && block.parentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? (
                            <Link 
                                to={`/${chainId}/block/${Number(block.number) - 1}`}
                                style={{ 
                                    color: '#10b981', 
                                    fontWeight: '600',
                                    textDecoration: 'none'
                                }}
                            >
                                {truncate(block.parentHash, 10, 8)}
                            </Link>
                        ) : (
                            truncate(block.parentHash, 10, 8)
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
                    }}>Miner</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem'
                    }} title={block.miner}>
                        {chainId ? (
                            <Link 
                                to={`/${chainId}/address/${block.miner}`}
                                style={{ 
                                    color: '#10b981', 
                                    fontWeight: '600',
                                    textDecoration: 'none'
                                }}
                            >
                                {truncate(block.miner)}
                            </Link>
                        ) : (
                            truncate(block.miner)
                        )}
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
                    }}>Gas Used</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>
                        {Number(block.gasUsed).toLocaleString()}
                        <span style={{ color: '#6b7280', marginLeft: '4px', fontSize: '0.85rem' }}>
                            ({((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(1)}%)
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
                    }}>Gas Limit</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.gasLimit).toLocaleString()}</span>
                </div>
            </div>

            {/* Difficulty */}
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
                    }}>Difficulty</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.difficulty).toLocaleString()}</span>
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
                    }}>Total Difficulty</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                    }}>{Number(block.totalDifficulty).toLocaleString()}</span>
                </div>
            </div>

            {/* Merkle Roots */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px',
                marginBottom: block.extraData && block.extraData !== '0x' ? '16px' : '0'
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
                    }}>State Root</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.stateRoot}>{truncate(block.stateRoot, 10, 8)}</span>
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
                    }}>Transactions Root</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.transactionsRoot}>{truncate(block.transactionsRoot, 10, 8)}</span>
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
                    }}>Receipts Root</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.receiptsRoot}>{truncate(block.receiptsRoot, 10, 8)}</span>
                </div>
            </div>

            {/* Extra Data */}
            {block.extraData && block.extraData !== '0x' && (
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
                    }}>Extra Data</span>
                    <span style={{ 
                        fontWeight: '500',
                        color: 'var(--text-color, #1f2937)',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                    }} title={block.extraData}>
                        {block.extraData.length > 20 ? truncate(block.extraData, 10, 8) : block.extraData}
                    </span>
                </div>
            )}
        </div>
    );
};

export default BlockDisplay;
