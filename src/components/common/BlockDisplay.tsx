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
                <span className="block-number">{Number(block.number).toString()}</span>
            </div>

            <div className="block-display-grid">
                <div className="block-detail-item">
                    <span className="detail-label">Hash</span>
                    <span className="detail-value" title={block.hash}>{truncate(block.hash, 10, 8)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Parent Hash</span>
                    <span className="detail-value" title={block.parentHash}>
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

                <div className="block-detail-item">
                    <span className="detail-label">Timestamp</span>
                    <span className="detail-value">{formatTime(block.timestamp)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Miner</span>
                    <span className="detail-value" title={block.miner}>
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

                <div className="block-detail-item">
                    <span className="detail-label">Transactions</span>
                    <span className="detail-value">{block.transactions ? block.transactions.length : 0}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Uncles</span>
                    <span className="detail-value">{block.uncles ? block.uncles.length : 0}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Gas Used</span>
                    <span className="detail-value">
                        {Number(block.gasUsed).toLocaleString()}
                        <span style={{ color: '#6b7280', marginLeft: '4px' }}>
                            ({((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(2)}%)
                        </span>
                    </span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Gas Limit</span>
                    <span className="detail-value">{Number(block.gasLimit).toLocaleString()}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Difficulty</span>
                    <span className="detail-value">{Number(block.difficulty).toLocaleString()}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Total Difficulty</span>
                    <span className="detail-value">{Number(block.totalDifficulty).toLocaleString()}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Size</span>
                    <span className="detail-value">{Number(block.size).toLocaleString()} bytes</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Nonce</span>
                    <span className="detail-value" title={block.nonce}>{block.nonce}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">State Root</span>
                    <span className="detail-value" title={block.stateRoot}>{truncate(block.stateRoot, 10, 8)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Transactions Root</span>
                    <span className="detail-value" title={block.transactionsRoot}>{truncate(block.transactionsRoot, 10, 8)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Receipts Root</span>
                    <span className="detail-value" title={block.receiptsRoot}>{truncate(block.receiptsRoot, 10, 8)}</span>
                </div>

                {block.extraData && block.extraData !== '0x' && (
                    <div className="block-detail-item">
                        <span className="detail-label">Extra Data</span>
                        <span className="detail-value" title={block.extraData}>
                            {block.extraData.length > 20 ? truncate(block.extraData, 10, 8) : block.extraData}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockDisplay;
