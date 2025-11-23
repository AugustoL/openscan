import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSourcify } from '../../hooks/useSourcify';
import { Address } from '../../types';
import { AppContext } from '../../context';
import { useZipJsonReader } from '../../hooks/useZipJsonReader';

interface AddressDisplayProps {
    address: Address;
    addressHash: string;
    chainId?: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, addressHash, chainId = '1' }) => {
    const [storageSlot, setStorageSlot] = useState('');
    const [storageValue, setStorageValue] = useState('');
    const [showContractDetails, setShowContractDetails] = useState(false);
    const { jsonFiles, setJsonFiles } = useContext(AppContext);
    const { processZip, loading: fileLoading, error: fileError } = useZipJsonReader();
    
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
    
    function getSourceCodeByAddress<T extends Record<string, any>>(
        root: T,
        address: string
        ): string | undefined {
            return root[address.toLowerCase()]?.sourceCode
        }

    const sourceCode = getSourceCodeByAddress(jsonFiles, addressHash) || jsonFiles["0x5fbdb2315678afecb367f032d93f642f64180aa3"]?.sourceCode

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Address Header Card */}
            <div className="block-display-card">
                <div className="block-display-header">
                    <span className="block-label">Address</span>
                    <span className="block-number" style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                        {addressHash}
                    </span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '0'
                }}>
                    {/* Type */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
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
                            fontWeight: '600',
                            color: isContract ? '#3b82f6' : '#10b981',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>
                            {isContract ? '📄 Contract' : '👤 EOA'}
                        </span>
                    </div>

                    {/* Balance */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        background: 'rgba(16, 185, 129, 0.04)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #10b981'
                    }}>
                        <span style={{ 
                            fontSize: '0.85rem',
                            color: '#10b981',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>Balance</span>
                        <span style={{ 
                            fontWeight: '600',
                            color: '#059669',
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '0.95rem'
                        }}>
                            {formatBalance(address.balance)}
                        </span>
                    </div>

                    {/* Transaction Count */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
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
                        }}>
                            {Number(address.txCount).toLocaleString()}
                        </span>
                    </div>
                    
                    {/* Verification (only for contracts) */}
                    {isContract && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 16px',
                            background: 'rgba(16, 185, 129, 0.04)',
                            borderRadius: '8px',
                            borderLeft: '3px solid #10b981'
                        }}>
                            <span style={{ 
                                fontSize: '0.85rem',
                                color: '#10b981',
                                fontWeight: '600',
                                fontFamily: 'Outfit, sans-serif'
                            }}>Verified</span>
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                {sourcifyLoading ? (
                                    <span style={{ 
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '0.9rem',
                                        fontFamily: 'Outfit, sans-serif'
                                    }}>
                                        Checking...
                                    </span>
                                ) : isVerified ? (
                                    <>
                                        <span style={{ 
                                            color: '#10b981',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            fontFamily: 'Outfit, sans-serif'
                                        }}>
                                            ✓ Yes
                                        </span>
                                        {sourcifyData?.match && (
                                            <span style={{ 
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                borderRadius: '4px',
                                                color: '#10b981',
                                                fontWeight: '600'
                                            }}>
                                                {sourcifyData.match === 'perfect' ? 'Perfect' : 'Partial'}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span style={{ 
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '0.9rem',
                                        fontFamily: 'Outfit, sans-serif'
                                    }}>
                                        No
                                    </span>
                                )}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Contract Verification Details */}
            {isContract && isVerified && sourcifyData && (
                <div className="block-display-card">
                    <div className="block-display-header" style={{ cursor: 'pointer' }} onClick={() => setShowContractDetails(!showContractDetails)}>
                        <span className="block-label">Contract Details</span>
                        <span style={{ fontSize: '1.2rem', color: '#10b981' }}>{showContractDetails ? '▼' : '▶'}</span>
                    </div>
                    
                    {showContractDetails && (
                        <div className="block-display-grid">
                            {sourcifyData.name && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Contract Name</span>
                                    <span className="detail-value" style={{ color: '#10b981', fontWeight: '600' }}>
                                        {sourcifyData.name}
                                    </span>
                                </div>
                            )}
                            
                            {sourcifyData.compilerVersion && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Compiler Version</span>
                                    <span className="detail-value">{sourcifyData.compilerVersion}</span>
                                </div>
                            )}
                            
                            {sourcifyData.evmVersion && (
                                <div className="block-detail-item">
                                    <span className="detail-label">EVM Version</span>
                                    <span className="detail-value">{sourcifyData.evmVersion}</span>
                                </div>
                            )}
                            
                            {sourcifyData.chainId && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Chain ID</span>
                                    <span className="detail-value">{sourcifyData.chainId}</span>
                                </div>
                            )}
                            
                            {sourcifyData.verifiedAt && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Verified At</span>
                                    <span className="detail-value">
                                        {new Date(sourcifyData.verifiedAt).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            
                            {sourcifyData.match && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Match Type</span>
                                    <span className="detail-value" style={{ 
                                        color: sourcifyData.match === 'perfect' ? '#10b981' : '#f59e0b',
                                        fontWeight: '600'
                                    }}>
                                        {sourcifyData.match.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            
                            {sourcifyData.creation_match && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Creation Match</span>
                                    <span className="detail-value" style={{ 
                                        color: sourcifyData.creation_match === 'perfect' ? '#10b981' : '#f59e0b',
                                        fontWeight: '600'
                                    }}>
                                        {sourcifyData.creation_match.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            
                            {sourcifyData.runtime_match && (
                                <div className="block-detail-item">
                                    <span className="detail-label">Runtime Match</span>
                                    <span className="detail-value" style={{ 
                                        color: sourcifyData.runtime_match === 'perfect' ? '#10b981' : '#f59e0b',
                                        fontWeight: '600'
                                    }}>
                                        {sourcifyData.runtime_match.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            
                            {/* Contract Bytecode */}
                            <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="detail-label">Contract Bytecode</span>
                                <div style={{
                                    marginTop: '8px',
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    wordBreak: 'break-all',
                                    color: '#10b981',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                }}>
                                    {address.code}
                                </div>
                            </div>
                            
                            {/* Source Files */}
                            {sourcifyData.files && sourcifyData.files.length > 0 && (
                                <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="detail-label">Source Files</span>
                                    <div style={{ 
                                        marginTop: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        {sourcifyData.files.map((file: any, idx: number) => (
                                            <div key={idx} style={{
                                                padding: '8px 12px',
                                                background: 'rgba(16, 185, 129, 0.08)',
                                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                                borderRadius: '6px',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                color: '#10b981',
                                            }}>
                                                📄 {file.name || file.path}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Contract ABI */}
                            {sourcifyData.abi && sourcifyData.abi.length > 0 && (
                                <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="detail-label">Contract ABI</span>
                                    <div style={{ marginTop: '8px' }}>
                                        {/* Functions */}
                                        {sourcifyData.abi.filter((item: any) => item.type === 'function').length > 0 && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ 
                                                    fontSize: '0.85rem', 
                                                    color: '#10b981', 
                                                    marginBottom: '6px',
                                                    fontWeight: '600'
                                                }}>
                                                    Functions ({sourcifyData.abi.filter((item: any) => item.type === 'function').length})
                                                </div>
                                                <div style={{ 
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '8px'
                                                }}>
                                                    {sourcifyData.abi
                                                        .filter((item: any) => item.type === 'function')
                                                        .slice(0, 15)
                                                        .map((func: any, idx: number) => (
                                                            <span key={idx} style={{
                                                                padding: '4px 10px',
                                                                background: 'rgba(59, 130, 246, 0.15)',
                                                                color: '#3b82f6',
                                                                borderRadius: '6px',
                                                                fontSize: '0.8rem',
                                                                fontFamily: 'monospace'
                                                            }}>
                                                                {func.name}
                                                            </span>
                                                        ))}
                                                    {sourcifyData.abi.filter((item: any) => item.type === 'function').length > 15 && (
                                                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', alignSelf: 'center' }}>
                                                            +{sourcifyData.abi.filter((item: any) => item.type === 'function').length - 15} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Events */}
                                        {sourcifyData.abi.filter((item: any) => item.type === 'event').length > 0 && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ 
                                                    fontSize: '0.85rem', 
                                                    color: '#10b981', 
                                                    marginBottom: '6px',
                                                    fontWeight: '600'
                                                }}>
                                                    Events ({sourcifyData.abi.filter((item: any) => item.type === 'event').length})
                                                </div>
                                                <div style={{ 
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '8px'
                                                }}>
                                                    {sourcifyData.abi
                                                        .filter((item: any) => item.type === 'event')
                                                        .slice(0, 10)
                                                        .map((event: any, idx: number) => (
                                                            <span key={idx} style={{
                                                                padding: '4px 10px',
                                                                background: 'rgba(139, 92, 246, 0.15)',
                                                                color: '#8b5cf6',
                                                                borderRadius: '6px',
                                                                fontSize: '0.8rem',
                                                                fontFamily: 'monospace'
                                                            }}>
                                                                {event.name}
                                                            </span>
                                                        ))}
                                                    {sourcifyData.abi.filter((item: any) => item.type === 'event').length > 10 && (
                                                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', alignSelf: 'center' }}>
                                                            +{sourcifyData.abi.filter((item: any) => item.type === 'event').length - 10} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Constructor */}
                                        {sourcifyData.abi.find((item: any) => item.type === 'constructor') && (
                                            <div>
                                                <div style={{ 
                                                    fontSize: '0.85rem', 
                                                    color: '#10b981', 
                                                    marginBottom: '6px',
                                                    fontWeight: '600'
                                                }}>
                                                    Constructor
                                                </div>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    background: 'rgba(245, 158, 11, 0.15)',
                                                    color: '#f59e0b',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontFamily: 'monospace',
                                                    display: 'inline-block'
                                                }}>
                                                    constructor
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Metadata Info */}
                            {sourcifyData.metadata && (
                                <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="detail-label">Additional Metadata</span>
                                    <div style={{
                                        marginTop: '8px',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '12px'
                                    }}>
                                        {sourcifyData.metadata.language && (
                                            <div style={{ 
                                                padding: '8px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '6px'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '4px' }}>
                                                    Language
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#10b981' }}>
                                                    {sourcifyData.metadata.language}
                                                </div>
                                            </div>
                                        )}
                                        {sourcifyData.metadata.compiler && (
                                            <div style={{ 
                                                padding: '8px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '6px'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '4px' }}>
                                                    Compiler
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#10b981' }}>
                                                    {sourcifyData.metadata.compiler.version}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <div className="block-detail-item" style={{ gridColumn: '1 / -1' }}>
                                <a
                                    href={`https://repo.sourcify.dev/contracts/full_match/${chainId}/${addressHash}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: '#10b981',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    View Full Contract on Sourcify ↗
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Transactions Table */}
            {address.recentTransactions && address.recentTransactions.length > 0 && (
                <div className="block-display-card">
                    <div className="block-display-header">
                        <span className="block-label">Recent Transactions</span>
                        <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                            Last {address.recentTransactions.length} transactions
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontFamily: 'Outfit, sans-serif',
                        }}>
                            <thead>
                                <tr style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.85rem' }}>
                                        TX Hash
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.85rem' }}>
                                        From
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.85rem' }}>
                                        To
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.85rem' }}>
                                        Value
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', fontSize: '0.85rem' }}>
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {address.recentTransactions.map((tx, index) => (
                                    <tr key={tx.hash} style={{
                                        borderBottom: index < address.recentTransactions!.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px' }}>
                                            <Link
                                                to={`/${chainId}/tx/${tx.hash}`}
                                                style={{
                                                    color: '#10b981',
                                                    textDecoration: 'none',
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {truncate(tx.hash, 8, 6)}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <Link
                                                to={`/${chainId}/address/${tx.from}`}
                                                style={{
                                                    color: tx.from?.toLowerCase() === addressHash.toLowerCase() ? '#f59e0b' : '#10b981',
                                                    textDecoration: 'none',
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {tx.from?.toLowerCase() === addressHash.toLowerCase() ? 'This Address' : truncate(tx.from || '', 6, 4)}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {tx.to ? (
                                                <Link
                                                    to={`/${chainId}/address/${tx.to}`}
                                                    style={{
                                                        color: tx.to?.toLowerCase() === addressHash.toLowerCase() ? '#f59e0b' : '#10b981',
                                                        textDecoration: 'none',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.9rem',
                                                    }}
                                                >
                                                    {tx.to?.toLowerCase() === addressHash.toLowerCase() ? 'This Address' : truncate(tx.to, 6, 4)}
                                                </Link>
                                            ) : (
                                                <span style={{ color: '#8b5cf6', fontSize: '0.85rem', fontWeight: '600' }}>
                                                    Contract Creation
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
                                            {formatValue(tx.value)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {tx.receipt?.status === '0x1' ? (
                                                <span style={{
                                                    padding: '4px 10px',
                                                    background: 'rgba(16, 185, 129, 0.15)',
                                                    color: '#10b981',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                }}>
                                                    ✓ Success
                                                </span>
                                            ) : tx.receipt?.status === '0x0' ? (
                                                <span style={{
                                                    padding: '4px 10px',
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    color: '#ef4444',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                }}>
                                                    ✗ Failed
                                                </span>
                                            ) : (
                                                <span style={{
                                                    padding: '4px 10px',
                                                    background: 'rgba(245, 158, 11, 0.15)',
                                                    color: '#f59e0b',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                }}>
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
                    <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <input
                                type="text"
                                placeholder="Storage slot (e.g., 0x0)"
                                value={storageSlot}
                                onChange={(e) => setStorageSlot(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#1f2937',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                }}
                            />
                            <button
                                onClick={handleGetStorage}
                                style={{
                                    padding: '10px 24px',
                                    background: '#10b981',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                            >
                                Get
                            </button>
                        </div>
                        {storageValue && (
                            <div style={{
                                padding: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all',
                                color: '#10b981',
                            }}>
                                {storageValue}
                            </div>
                        )}
                    </div>

                </div>
            )}
            { isContract && sourceCode && (
                <div style={{
                                padding: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all',
                                color: '#10b981',
                            }}>
                <div className="block-detail-item">
                    <span className="detail-label">Source Code</span>
                    <span className="detail-value" title={address.code}>{sourceCode}</span>
                </div>
                </div>
            )}
            </div>
    );
};

export default AddressDisplay;
