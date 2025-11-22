import React from 'react';
import { Block } from '../../types';

interface BlockDisplayProps {
    block: Block;
}

const BlockDisplay: React.FC<BlockDisplayProps> = ({ block }) => {
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
                <span className="block-number">{block.number}</span>
            </div>

            <div className="block-display-grid">
                <div className="block-detail-item">
                    <span className="detail-label">Hash</span>
                    <span className="detail-value" title={block.hash}>{truncate(block.hash)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Timestamp</span>
                    <span className="detail-value">{formatTime(block.timestamp)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Miner</span>
                    <span className="detail-value" title={block.miner}>{truncate(block.miner)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Transactions</span>
                    <span className="detail-value">{block.transactions ? block.transactions.length : 0}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Gas Used</span>
                    <span className="detail-value">{Number(block.gasUsed).toLocaleString()}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Size</span>
                    <span className="detail-value">{Number(block.size).toLocaleString()} bytes</span>
                </div>
            </div>
        </div>
    );
};

export default BlockDisplay;
