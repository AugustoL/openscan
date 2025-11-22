import { useParams, Link } from 'react-router-dom';
import { useDataService } from '../../hooks/useDataService';
import { useEffect, useState } from 'react';
import { Block } from '../../types';
import Loader from '../common/Loader';

export default function Blocks() {
  const { chainId } = useParams<{ chainId?: string }>();
  const numericChainId = Number(chainId) || 1;
  const dataService = useDataService(numericChainId);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataService) {
      setLoading(false);
      return;
    }

    console.log('Fetching latest 10 blocks for chain:', numericChainId);
    setLoading(true);
    setError(null);

    dataService
      .getLatestBlocks(10)
      .then(fetchedBlocks => {
        console.log('Fetched blocks:', fetchedBlocks);
        setBlocks(fetchedBlocks);
      })
      .catch((err) => {
        console.error('Error fetching blocks:', err);
        setError(err.message || 'Failed to fetch blocks');
      })
      .finally(() => setLoading(false));
  }, [dataService, numericChainId]);

  const truncate = (str: string, start = 10, end = 8) => {
    if (!str) return '';
    if (str.length <= start + end) return str;
    return `${str.slice(0, start)}...${str.slice(-end)}`;
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Latest Blocks</h1>
        <Loader text="Loading blocks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Latest Blocks</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '0.5rem' }}>Latest Blocks</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Showing {blocks.length} most recent blocks</p>
      
      <div className="table-wrapper" style={{ 
        background: 'var(--bg-color, #fff)',
        border: '1px solid #10b981',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)'
      }}>
        <table className="dash-table">
          <thead>
            <tr>
              <th style={{ 
                fontFamily: 'Outfit, sans-serif', 
                color: '#10b981', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.9rem'
              }}>Block</th>
              <th style={{ 
                fontFamily: 'Outfit, sans-serif', 
                color: '#10b981', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.9rem'
              }}>Timestamp</th>
              <th style={{ 
                fontFamily: 'Outfit, sans-serif', 
                color: '#10b981', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.9rem'
              }}>Txns</th>
              <th style={{ 
                fontFamily: 'Outfit, sans-serif', 
                color: '#10b981', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.9rem'
              }}>Miner</th>
              <th style={{ 
                fontFamily: 'Outfit, sans-serif', 
                color: '#10b981', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.9rem'
              }}>Gas Used</th>
              <th style={{ 
                fontFamily: 'Outfit, sans-serif', 
                color: '#10b981', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.9rem'
              }}>Gas Limit</th>
              <th style={{ 
                fontFamily: 'Outfit, sans-serif', 
                color: '#10b981', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.9rem'
              }}>Size</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.number} style={{ 
                background: 'rgba(16, 185, 129, 0.04)',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}>
                <td>
                  <Link 
                    to={`/${chainId}/block/${Number(block.number).toString()}`}
                    style={{ 
                      color: '#10b981', 
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '1.1rem'
                    }}
                  >
                    {Number(block.number).toLocaleString()}
                  </Link>
                </td>
                <td style={{ 
                  fontSize: '0.95rem', 
                  color: 'var(--text-color, #1f2937)',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: '500'
                }}>
                  {formatTime(block.timestamp)}
                </td>
                <td style={{ 
                  fontWeight: '600', 
                  color: '#059669',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1rem'
                }}>
                  {block.transactions ? block.transactions.length : 0}
                </td>
                <td style={{ 
                  fontSize: '0.9rem', 
                  fontFamily: 'Outfit, sans-serif',
                  color: 'var(--text-color, #1f2937)',
                  fontWeight: '500'
                }} title={block.miner}>
                  <Link 
                    to={`/${chainId}/address/${block.miner}`}
                    style={{ 
                      color: '#10b981', 
                      fontWeight: '600',
                      textDecoration: 'none',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    {truncate(block.miner)}
                  </Link>
                </td>
                <td style={{ 
                  fontSize: '0.95rem',
                  fontFamily: 'Outfit, sans-serif',
                  color: 'var(--text-color, #1f2937)',
                  fontWeight: '500'
                }}>
                  {Number(block.gasUsed).toLocaleString()}
                </td>
                <td style={{ 
                  fontSize: '0.95rem', 
                  color: '#6b7280',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: '500'
                }}>
                  {Number(block.gasLimit).toLocaleString()}
                </td>
                <td style={{ 
                  fontSize: '0.95rem', 
                  color: '#6b7280',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: '500'
                }}>
                  {Number(block.size).toLocaleString()} bytes
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
