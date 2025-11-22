import React, { useState } from 'react';
import { Address } from '../../types';

interface AddressDisplayProps {
    address: Address;
    addressHash: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, addressHash }) => {
    const [storageSlot, setStorageSlot] = useState('');
    const [storageValue, setStorageValue] = useState('');

    const truncate = (str: string, start = 6, end = 4) => {
        if (!str) return '';
        if (str.length <= start + end) return str;
        return `${str.slice(0, start)}...${str.slice(-end)}`;
    };

    const formatBalance = (balance: string) => {
        try {
            const eth = Number(balance) / 1e18;
            return `${eth.toFixed(6)} ETH`;
        } catch (e) {
            return balance;
        }
    };

    const handleGetStorage = () => {
        // Check if the slot exists in the storeageAt object
        if (address.storeageAt && address.storeageAt[storageSlot]) {
            setStorageValue(address.storeageAt[storageSlot]);
        } else {
            setStorageValue('0x0000000000000000000000000000000000000000000000000000000000000000');
        }
    };

    const isContract = address.code && address.code !== '0x';

    return (
        <div className="block-display-card">
            <div className="block-display-header">
                <span className="block-label">Address:</span>
                <span className="block-number">{truncate(addressHash, 8, 6)}</span>
            </div>

            <div className="block-display-grid">
                <div className="block-detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{isContract ? 'Contract' : 'EOA (Externally Owned Account)'}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Balance</span>
                    <span className="detail-value">{formatBalance(address.balance)}</span>
                </div>

                <div className="block-detail-item">
                    <span className="detail-label">Transaction Count</span>
                    <span className="detail-value">{address.txCount}</span>
                </div>

                {isContract && (
                    <div className="block-detail-item">
                        <span className="detail-label">Contract Code</span>
                        <span className="detail-value" title={address.code}>{truncate(address.code, 10, 10)}</span>
                    </div>
                )}

                <div className="block-detail-item storage-section">
                    <span className="detail-label">Storage</span>
                    <div className="storage-controls">
                        <div className="storage-input-group">
                            <input
                                type="text"
                                className="storage-input"
                                placeholder="Enter storage slot (e.g., 0x0)"
                                value={storageSlot}
                                onChange={(e) => setStorageSlot(e.target.value)}
                            />
                            <button
                                className="storage-get-button"
                                onClick={handleGetStorage}
                            >
                                Get
                            </button>
                        </div>
                        {storageValue && (
                            <div className="storage-output">
                                <span className="storage-output-label">Output:</span>
                                <span className="storage-output-value">{storageValue}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddressDisplay;
