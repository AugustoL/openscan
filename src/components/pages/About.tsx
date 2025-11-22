import React from 'react';

const About: React.FC = () => {
    const appVersion = process.env.REACT_APP_VERSION || '0.1.0';
    const commitHash = process.env.REACT_APP_COMMIT_HASH || 'development';
    const formattedCommitHash = commitHash.length > 7 ? commitHash.substring(0, 7) : commitHash;
    
    return (
        <div style={{ 
            padding: '40px 20px',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{
                textAlign: 'center',
                marginBottom: '60px'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '16px'
                }}>
                    About OpenScan
                </h1>
                <p style={{
                    fontSize: '1.2rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'Outfit, sans-serif',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    An open-source, lightweight, multi-chain blockchain explorer
                </p>
            </div>

            {/* Version Info Card */}
            <div style={{
                background: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '40px',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '40px',
                    flexWrap: 'wrap'
                }}>
                    <div>
                        <div style={{
                            fontSize: '0.85rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '8px',
                            fontFamily: 'Outfit, sans-serif'
                        }}>
                            Version
                        </div>
                        <div style={{
                            fontSize: '1.2rem',
                            color: '#10b981',
                            fontWeight: '600',
                            fontFamily: 'Outfit, sans-serif'
                        }}>
                            {appVersion}
                        </div>
                    </div>
                    <div>
                        <div style={{
                            fontSize: '0.85rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '8px',
                            fontFamily: 'Outfit, sans-serif'
                        }}>
                            Commit
                        </div>
                        <div style={{
                            fontSize: '1.2rem',
                            color: '#10b981',
                            fontWeight: '600',
                            fontFamily: 'monospace'
                        }}>
                            {formattedCommitHash}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <h2 style={{
                fontSize: '2rem',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '32px',
                textAlign: 'center'
            }}>
                Features
            </h2>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '60px'
            }}>
                {[
                    {
                        title: '🌐 Multi-Chain Support',
                        description: 'Explore Ethereum Mainnet, Sepolia, Arbitrum One, Optimism, and local development networks.'
                    },
                    {
                        title: '🔍 Block Explorer',
                        description: 'View detailed information about blocks, transactions, and addresses across all supported chains.'
                    },
                    {
                        title: '✅ Contract Verification',
                        description: 'Integration with Sourcify API to display verified contract source code, ABI, and metadata.'
                    },
                    {
                        title: '📊 Real-Time Data',
                        description: 'Live network statistics, gas prices, and mempool monitoring for supported chains.'
                    },
                    {
                        title: '🎨 Modern UI',
                        description: 'Clean, responsive interface with dark theme optimized for blockchain data visualization.'
                    },
                    {
                        title: '⚡ Fast Performance',
                        description: 'Efficient caching and lazy loading for quick data access and smooth user experience.'
                    }
                ].map((feature, index) => (
                    <div key={index} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '24px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}>
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '600',
                            color: '#10b981',
                            marginBottom: '12px'
                        }}>
                            {feature.title}
                        </h3>
                        <p style={{
                            fontSize: '0.95rem',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontFamily: 'Outfit, sans-serif',
                            lineHeight: '1.6',
                            margin: 0
                        }}>
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Supported Networks */}
            <h2 style={{
                fontSize: '2rem',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '32px',
                textAlign: 'center'
            }}>
                Supported Networks
            </h2>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '60px'
            }}>
                {[
                    { name: 'Ethereum Mainnet', chainId: '1', icon: '⟠' },
                    { name: 'Sepolia Testnet', chainId: '11155111', icon: '🧪' },
                    { name: 'Arbitrum One', chainId: '42161', icon: '🔷' },
                    { name: 'Optimism', chainId: '10', icon: '🔴' },
                    { name: 'Localhost', chainId: '31337', icon: '💻' }
                ].map((network, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: 'rgba(16, 185, 129, 0.04)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '10px'
                    }}>
                        <div style={{
                            fontSize: '2rem',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '8px'
                        }}>
                            {network.icon}
                        </div>
                        <div>
                            <div style={{
                                fontSize: '1rem',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: '600',
                                color: '#10b981',
                                marginBottom: '4px'
                            }}>
                                {network.name}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                fontFamily: 'monospace',
                                color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                                Chain ID: {network.chainId}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Open Source */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                marginBottom: '40px'
            }}>
                <h2 style={{
                    fontSize: '2rem',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '700',
                    color: '#10b981',
                    marginBottom: '16px'
                }}>
                    Open Source
                </h2>
                <p style={{
                    fontSize: '1.1rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: '1.6',
                    maxWidth: '800px',
                    margin: '0 auto 24px'
                }}>
                    OpenScan is free and open source software. Contributions, issues, and feature requests are welcome!
                </p>
                <a
                    href="https://github.com/AugustoL/openscan"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: '#10b981',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                >
                    View on GitHub ↗
                </a>
            </div>

            {/* License */}
            <div style={{
                textAlign: 'center',
                padding: '20px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.9rem'
            }}>
                <p style={{ margin: 0 }}>
                    OpenScan is licensed under the MIT License
                </p>
                <p style={{ margin: '8px 0 0' }}>
                    Built with ❤️ for the Ethereum community
                </p>
            </div>
        </div>
    );
};

export default About;
