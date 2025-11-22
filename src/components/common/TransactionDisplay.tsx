import React from 'react';
import { Transaction } from '../../types';

interface TransactionDisplayProps {
    transaction: Transaction;
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({ transaction }) => {
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

    return (
        <div className="block-display-card">
            <div className="block-display-header">
                <span className="block-label">Transaction:</span>
                <span className="block-number">{truncate(transaction.hash, 8, 6)}</span>
            </div>

            <div className="block-display-grid">
                <div className="block-detail-item">
                    <span className="detail-label">From</span>
                    <span className="detail-value" title={transaction.from}>{truncate(transaction.from)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">To</span>
                    <span className="detail-value" title={transaction.to}>{truncate(transaction.to)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Value</span>
                    <span className="detail-value">{formatValue(transaction.value)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Block Number</span>
                    <span className="detail-value">{transaction.blockNumber}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Gas Price</span>
                    <span className="detail-value">{Number(transaction.gasPrice).toLocaleString()} wei</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Gas</span>
                    <span className="detail-value">{Number(transaction.gas).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default TransactionDisplay;
