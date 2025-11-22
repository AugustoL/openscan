import { Link } from 'react-router-dom';
import { useState } from 'react';
import arbitrumLogo from '../../assets/arbitrum-logo.svg';
import optimismLogo from '../../assets/optimism-logo.svg';
import hardhatLogo from '../../assets/hardhat-logo.svg';

interface NetworkCardProps {
  to: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  chainId: string;
  centered?: boolean;
}

const NetworkCard: React.FC<NetworkCardProps> = ({ to, name, description, icon, color, chainId, centered = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        display: 'block',
        width: '100%',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `2px solid ${isHovered ? color : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '16px',
          padding: '24px',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered
            ? `0 8px 32px ${color}40`
            : '0 4px 16px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '12px',
          justifyContent: centered ? 'center' : 'flex-start',
        }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ flex: centered ? '0' : '1' }}>
            <h3
              style={{
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: "#059669",
                marginBottom: '4px',
              }}
            >
              {name}
            </h3>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.875rem',
                color: '#059669',
                fontWeight: '500',
              }}
            >
              Chain ID: {chainId}
            </div>
          </div>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: 'Outfit, sans-serif',
            fontSize: '0.95rem',
            color: '#0da978ff',
            lineHeight: '1.5',
            textAlign: 'center',
          }}
        >
          {description}
        </p>
      </div>
    </Link>
  );
};

export default function Home() {
  const mainNetworks = [
    {
      to: '/1',
      name: 'Ethereum Mainnet',
      description: 'The main Ethereum network',
      chainId: '1',
      color: '#627EEA',
      icon: (
        <svg width="32" height="32" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg">
          <path fill="#627EEA" d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
          <path fill="#8C97C2" d="M127.962 0 0 212.32l127.962 75.639V154.158z"/>
          <path fill="#627EEA" d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z"/>
          <path fill="#8C97C2" d="M127.962 416.905v-104.72L0 236.585z"/>
          <path fill="#C1CCF7" d="m127.961 287.958 127.96-75.637-127.96-58.162z"/>
          <path fill="#8C97C2" d="m.001 212.321 127.96 75.637V154.159z"/>
        </svg>
      ),
    },
    {
      to: '/11155111',
      name: 'Sepolia Testnet',
      description: 'Ethereum test network for development',
      chainId: '11155111',
      color: '#F0CDC2',
      icon: (
        <svg width="32" height="32" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg">
          <path fill="#F0CDC2" d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
          <path fill="#D4A59A" d="M127.962 0 0 212.32l127.962 75.639V154.158z"/>
          <path fill="#F0CDC2" d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z"/>
          <path fill="#D4A59A" d="M127.962 416.905v-104.72L0 236.585z"/>
          <path fill="#F5E5DE" d="m127.961 287.958 127.96-75.637-127.96-58.162z"/>
          <path fill="#D4A59A" d="m.001 212.321 127.96 75.637V154.159z"/>
        </svg>
      ),
    },
    {
      to: '/42161',
      name: 'Arbitrum One',
      description: 'Ethereum Layer 2 scaling solution',
      chainId: '42161',
      color: '#28A0F0',
      icon: <img src={arbitrumLogo} alt="Arbitrum" width="32" height="32" />,
    },
    {
      to: '/10',
      name: 'Optimism',
      description: 'Ethereum Layer 2 with low fees',
      chainId: '10',
      color: '#FF0420',
      icon: <img src={optimismLogo} alt="Optimism" width="32" height="32" />,
    },
  ];

  const localhostNetwork = {
    to: '/31337',
    name: 'Localhost',
    description: 'Local development network, hardhat or anvil',
    chainId: '31337',
    color: '#FFF100',
    icon: <img src={hardhatLogo} alt="Localhost" width="32" height="32" />,

  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">OPENSCAN</h1>
        <p
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.1rem',
            color: '#0da978ff',
            textAlign: 'center',
            marginTop: '12px',
            marginBottom: '48px',
          }}
        >
          Select a blockchain network to explore
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {mainNetworks.map((network) => (
            <NetworkCard key={network.chainId} {...network} />
          ))}
        </div>
        
        {/* Localhost card spanning full width */}
        <div
          style={{
            maxWidth: '1400px',
            margin: '24px auto 0',
            width: '100%',
          }}
        >
          <NetworkCard {...localhostNetwork} centered={true} />
        </div>
      </div>
    </div>
  );
};