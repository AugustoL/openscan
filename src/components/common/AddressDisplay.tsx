import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSourcify } from '../../hooks/useSourcify';
import { Address } from '../../types';
import { AppContext } from '../../context';

interface AddressDisplayProps {
    address: Address;
    addressHash: string;
    chainId?: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, addressHash, chainId = '1' }) => {
    const [storageSlot, setStorageSlot] = useState('');
    const [storageValue, setStorageValue] = useState('');
    const [showContractDetails, setShowContractDetails] = useState(false);
    const { jsonFiles } = useContext(AppContext);

    const isContract = address.code && address.code !== '0x';

    // Fetch Sourcify data only if it's a contract
    const { data: sourcifyData, loading: sourcifyLoading, isVerified } = useSourcify(
        Number(chainId),
        isContract ? addressHash : undefined,
        'all',
        true
    );

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

    const formatValue = (value: string) => {
        try {
            const eth = Number(value) / 1e18;
            return `${eth.toFixed(6)} ETH`;
        } catch (e) {
            return '0 ETH';
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

    // Check if we have local artifact data for this address
    const localArtifact = jsonFiles[addressHash.toLowerCase()];

    // Parse local artifact to sourcify format if it exists
    const parsedLocalData = localArtifact ? {
        name: localArtifact.contractName,
        compilerVersion: localArtifact.buildInfo?.solcLongVersion,
        evmVersion: localArtifact.buildInfo?.input?.settings?.evmVersion,
        abi: localArtifact.abi,
        files: localArtifact.sourceCode ? [{
            name: localArtifact.sourceName || 'Contract.sol',
            path: localArtifact.sourceName || 'Contract.sol',
            content: localArtifact.sourceCode
        }] : undefined,
        metadata: {
            language: localArtifact.buildInfo?.input?.language,
            compiler: localArtifact.buildInfo ? {
                version: localArtifact.buildInfo.solcVersion
            } : undefined
        },
        match: 'perfect' as const,
        creation_match: null,
        runtime_match: null,
        chainId: chainId,
        address: addressHash,
        verifiedAt: undefined
    } : null;

    // Use local artifact data if available and sourcify is not verified, otherwise use sourcify
    const contractData = (isVerified && sourcifyData) ? sourcifyData : parsedLocalData;

    return (
        <div className="flex-column" style={{ gap: '24px' }}>
            {/* Address Header Card */}
            <div className="block-display-card">
                <div className="block-display-header">
                    <span className="block-label">Address</span>
                    <span className="block-number address-block-number">
                        {addressHash}
                    </span>
                </div>

                <div className="data-grid-2">
                    {/* Type */}
                    <div className="info-box">
                        <span className="info-box-label">Type</span>
                        <span className={`address-type-value ${isContract ? 'address-type-contract' : 'address-type-eoa'}`}>
                            {isContract ? '📄 Contract' : '👤 EOA'}
                        </span>
                    </div>

                    {/* Balance */}
                    <div className="info-box">
                        <span className="info-box-label">Balance</span>
                        <span className="info-box-value-accent">
                            {formatBalance(address.balance)}
                        </span>
                    </div>

                    {/* Transaction Count */}
                    <div className="info-box">
                        <span className="info-box-label">Transactions</span>
                        <span className="info-box-value-accent">
                            {Number(address.txCount).toLocaleString()}
                        </span>
                    </div>

                    {/* Verification (only for contracts) */}
                    {isContract && (
                        <div className="info-box">
                            <span className="info-box-label">Verified</span>
                            <span className="verification-status">
                                {sourcifyLoading ? (
                                    <span className="verification-text-loading">
                                        Checking...
                                    </span>
                                ) : (isVerified || parsedLocalData) ? (
                                    <>
                                        <span className="verification-text-success">
                                            ✓ Yes
                                        </span>
                                        {contractData?.match && (
                                            <span className="verification-badge">
                                                {contractData.match === 'perfect' ? parsedLocalData ? 'Local' : 'Perfect' : 'Partial'}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="verification-text">
                                        No
                                    </span>
                                )}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Contract Verification Details */}
            {isContract && (isVerified || parsedLocalData) && contractData && (
                <div className="block-display-card">
                    <div className="block-display-header contract-details-toggle" onClick={() => setShowContractDetails(!showContractDetails)}>
                        <span className="block-label">Contract Details</span>
                        <span className="contract-details-icon">{showContractDetails ? '▼' : '▶'}</span>
                    </div>

                    {showContractDetails && (
                        <div className="block-display-grid">
                            {contractData.name && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Contract Name</span>
                                    <span className="detail-value" style={{ color: '#10b981', fontWeight: '600' }}>
                                        {contractData.name}
                                    </span>
                                </div>
                            )}

                            {contractData.compilerVersion && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Compiler Version</span>
                                    <span className="detail-value">{contractData.compilerVersion}</span>
                                </div>
                            )}

                            {contractData.evmVersion && (
                                <div className="block-detail-item">
                                    <span className="detail-label">EVM Version</span>
                                    <span className="detail-value">{contractData.evmVersion}</span>
                                </div>
                            )}

                            {contractData.chainId && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Chain ID</span>
                                    <span className="detail-value">{contractData.chainId}</span>
                                </div>
                            )}

                            {contractData.verifiedAt && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Verified At</span>
                                    <span className="detail-value">
                                        {new Date(contractData.verifiedAt).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {contractData.match && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Match Type</span>
                                    <span className={`detail-value match-type-value ${contractData.match === 'perfect' ? 'match-type-perfect' : 'match-type-partial'}`}>
                                        {contractData.match.toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {contractData.creation_match && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Creation Match</span>
                                    <span className={`detail-value match-type-value ${contractData.creation_match === 'perfect' ? 'match-type-perfect' : 'match-type-partial'}`}>
                                        {contractData.creation_match.toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {contractData.runtime_match && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Runtime Match</span>
                                    <span className={`detail-value match-type-value ${contractData.runtime_match === 'perfect' ? 'match-type-perfect' : 'match-type-partial'}`}>
                                        {contractData.runtime_match.toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {/* Contract Bytecode */}
                            <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="detail-label">Contract Bytecode</span>
                                <div className="contract-code-display">
                                    {address.code}
                                </div>
                            </div>

                            {/* Source Code */}
                            {((contractData.files && contractData.files.length > 0) || (contractData as any).sources) && (() => {
                                // Prepare source files array - either from files or sources object
                                const sources = (contractData as any).sources;
                                const sourceFiles = contractData.files && contractData.files.length > 0
                                    ? contractData.files
                                    : sources
                                        ? Object.entries(sources).map(([path, source]: [string, any]) => ({
                                            name: path,
                                            path: path,
                                            content: source.content || ''
                                        }))
                                        : [];

                                return sourceFiles.length > 0 ? (
                                    <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                        <div className="source-toggle-container" onClick={() => {
                                            const elem = document.getElementById('source-code-content');
                                            const icon = document.getElementById('source-code-icon');
                                            if (elem && icon) {
                                                const isHidden = elem.style.display === 'none';
                                                elem.style.display = isHidden ? 'block' : 'none';
                                                icon.textContent = isHidden ? '▼' : '▶';
                                            }
                                        }}>
                                            <span className="detail-label">Source Code</span>
                                            <span id="source-code-icon" className="source-toggle-icon">▶</span>
                                        </div>
                                        <div id="source-code-content" style={{ marginTop: '8px', display: 'none' }}>
                                            {sourceFiles.map((file: any, idx: number) => (
                                                <div key={idx} className="source-file-container">
                                                    <div className="source-code-header">
                                                        📄 {file.name || file.path}
                                                    </div>
                                                    <pre className="source-code-content">
                                                        {file.content}
                                                    </pre>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            {/* Contract ABI */}
                            {contractData.abi && contractData.abi.length > 0 && (
                                <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="detail-label">Contract ABI</span>
                                    <div style={{ marginTop: '8px' }}>
                                        {/* Functions */}
                                        {contractData.abi.filter((item: any) => item.type === 'function').length > 0 && (
                                            <div className="abi-section">
                                                <div className="abi-section-title">
                                                    Functions ({contractData.abi.filter((item: any) => item.type === 'function').length})
                                                </div>
                                                <div className="abi-badge-container">
                                                    {contractData.abi
                                                        .filter((item: any) => item.type === 'function')
                                                        .slice(0, 15)
                                                        .map((func: any, idx: number) => (
                                                            <span key={idx} className="abi-badge-function">
                                                                {func.name}
                                                            </span>
                                                        ))}
                                                    {contractData.abi.filter((item: any) => item.type === 'function').length > 15 && (
                                                        <span className="abi-more-text">
                                                            +{contractData.abi.filter((item: any) => item.type === 'function').length - 15} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Events */}
                                        {contractData.abi.filter((item: any) => item.type === 'event').length > 0 && (
                                            <div className="abi-section">
                                                <div className="abi-section-title">
                                                    Events ({contractData.abi.filter((item: any) => item.type === 'event').length})
                                                </div>
                                                <div className="abi-badge-container">
                                                    {contractData.abi
                                                        .filter((item: any) => item.type === 'event')
                                                        .slice(0, 10)
                                                        .map((event: any, idx: number) => (
                                                            <span key={idx} className="abi-badge-event">
                                                                {event.name}
                                                            </span>
                                                        ))}
                                                    {contractData.abi.filter((item: any) => item.type === 'event').length > 10 && (
                                                        <span className="abi-more-text">
                                                            +{contractData.abi.filter((item: any) => item.type === 'event').length - 10} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Constructor */}
                                        {contractData.abi.find((item: any) => item.type === 'constructor') && (
                                            <div>
                                                <div className="abi-section-title">
                                                    Constructor
                                                </div>
                                                <span className="abi-badge-constructor">
                                                    constructor
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Metadata Info */}
                            {contractData.metadata && (
                                <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="detail-label">Additional Metadata</span>
                                    <div className="metadata-grid">
                                        {contractData.metadata.language && (
                                            <div className="metadata-item">
                                                <div className="metadata-label">
                                                    Language
                                                </div>
                                                <div className="metadata-value">
                                                    {contractData.metadata.language}
                                                </div>
                                            </div>
                                        )}
                                        {contractData.metadata.compiler && (
                                            <div className="metadata-item">
                                                <div className="metadata-label">
                                                    Compiler
                                                </div>
                                                <div className="metadata-value">
                                                    {contractData.metadata.compiler.version}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {sourcifyData && (<div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                <a
                                    href={`https://repo.sourcify.dev/contracts/full_match/${chainId}/${addressHash}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sourcify-link"
                                >
                                    View Full Contract on Sourcify ↗
                                </a>
                            </div>)}
                        </div>
                    )}
                </div>
            )}

            {/* Recent Transactions Table */}
            {address.recentTransactions && address.recentTransactions.length > 0 && (
                <div className="block-display-card">
                    <div className="block-display-header">
                        <span className="block-label">Recent Transactions</span>
                        <span className="recent-tx-header">
                            Last {address.recentTransactions.length} transactions
                        </span>
                    </div>
                    <div className="address-table-container">
                        <table className="address-table">
                            <thead>
                                <tr>
                                    <th>TX Hash</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th className="table-right">Value</th>
                                    <th className="table-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {address.recentTransactions.map((tx, index) => (
                                    <tr key={tx.hash}>
                                        <td>
                                            <Link
                                                to={`/${chainId}/tx/${tx.hash}`}
                                                className="address-table-link"
                                            >
                                                {truncate(tx.hash, 8, 6)}
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/${chainId}/address/${tx.from}`}
                                                className="address-table-link"
                                                style={{ color: tx.from?.toLowerCase() === addressHash.toLowerCase() ? '#f59e0b' : '#10b981' }}
                                            >
                                                {tx.from?.toLowerCase() === addressHash.toLowerCase() ? 'This Address' : truncate(tx.from || '', 6, 4)}
                                            </Link>
                                        </td>
                                        <td>
                                            {tx.to ? (
                                                <Link
                                                    to={`/${chainId}/address/${tx.to}`}
                                                    className="address-table-link"
                                                    style={{ color: tx.to?.toLowerCase() === addressHash.toLowerCase() ? '#f59e0b' : '#10b981' }}
                                                >
                                                    {tx.to?.toLowerCase() === addressHash.toLowerCase() ? 'This Address' : truncate(tx.to, 6, 4)}
                                                </Link>
                                            ) : (
                                                <span className="contract-creation-badge">
                                                    Contract Creation
                                                </span>
                                            )}
                                        </td>
                                        <td className="table-right address-table-value">
                                            {formatValue(tx.value)}
                                        </td>
                                        <td className="table-center">
                                            {tx.receipt?.status === '0x1' ? (
                                                <span className="table-status-badge table-status-success">
                                                    ✓ Success
                                                </span>
                                            ) : tx.receipt?.status === '0x0' ? (
                                                <span className="table-status-badge table-status-failed">
                                                    ✗ Failed
                                                </span>
                                            ) : (
                                                <span className="table-status-badge table-status-pending">
                                                    ⏳ Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Storage Section (for contracts) */}
            {isContract && (
                <div className="block-display-card">
                    <div className="block-display-header">
                        <span className="block-label">Contract Storage</span>
                    </div>
                    <div className="storage-section">
                        <div className="storage-input-row">
                            <input
                                type="text"
                                placeholder="Storage slot (e.g., 0x0)"
                                value={storageSlot}
                                onChange={(e) => setStorageSlot(e.target.value)}
                                className="storage-input"
                            />
                            <button
                                onClick={handleGetStorage}
                                className="storage-button"
                            >
                                Get
                            </button>
                        </div>
                        {storageValue && (
                            <div className="storage-value-display">
                                {storageValue}
                            </div>
                        )}
                    </div>

                </div>
            )}
            </div>
    );
};

export default AddressDisplay;
