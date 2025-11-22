import { useParams, Link } from 'react-router-dom';
import { useDataService } from '../../hooks/useDataService';
import { useEffect, useState } from 'react';
import { Transaction } from '../../types';
import Loader from '../common/Loader';

export default function Txs() {
  const { chainId } = useParams<{ chainId?: string }>();
  const numericChainId = Number(chainId) || 1;
  const dataService = useDataService(numericChainId);
  const [transactions, setTransactions] = useState<Array<Transaction & { blockNumber: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataService) {
      setLoading(false);
      return;
    }

    console.log('Fetching transactions from latest 10 blocks for chain:', numericChainId);
    setLoading(true);
    setError(null);

    dataService
      .getTransactionsFromLatestBlocks(10)
      .then(fetchedTransactions => {
        console.log('Fetched transactions:', fetchedTransactions);
        setTransactions(fetchedTransactions);
      })
      .catch((err) => {
        console.error('Error fetching transactions:', err);
        setError(err.message || 'Failed to fetch transactions');
      })
      .finally(() => setLoading(false));
  }, [dataService, numericChainId]);

  const truncate = (str: string, start = 10, end = 8) => {
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

  const formatGasPrice = (gasPrice: string) => {
    try {
      const gwei = Number(gasPrice) / 1e9;
      return `${gwei.toFixed(2)} Gwei`;
    } catch (e) {
      return gasPrice;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Latest Transactions</h1>
        <Loader text="Loading transactions from the last 10 blocks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Latest Transactions</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '0.5rem' }}>Latest Transactions</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Showing {transactions.length} transactions from the last 10 blocks
      </p>
      
      {transactions.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
          No transactions found in the last 10 blocks
        </p>
      ) : (
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
                }}>Tx Hash</th>
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
                }}>From</th>
                <th style={{ 
                  fontFamily: 'Outfit, sans-serif', 
                  color: '#10b981', 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.9rem'
                }}>To</th>
                <th style={{ 
                  fontFamily: 'Outfit, sans-serif', 
                  color: '#10b981', 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.9rem'
                }}>Value</th>
                <th style={{ 
                  fontFamily: 'Outfit, sans-serif', 
                  color: '#10b981', 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.9rem'
                }}>Gas Price</th>
                <th style={{ 
                  fontFamily: 'Outfit, sans-serif', 
                  color: '#10b981', 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.9rem'
                }}>Gas</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.hash} style={{ 
                  background: 'rgba(16, 185, 129, 0.04)',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}>
                  <td>
                    <Link 
                      to={`/${chainId}/tx/${transaction.hash}`}
                      style={{ 
                        color: '#10b981', 
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem'
                      }}
                      title={transaction.hash}
                    >
                      {truncate(transaction.hash)}
                    </Link>
                  </td>
                  <td>
                    <Link 
                      to={`/${chainId}/block/${transaction.blockNumber}`}
                      style={{ 
                        color: '#059669', 
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '1rem'
                      }}
                    >
                      {transaction.blockNumber}
                    </Link>
                  </td>
                  <td style={{ 
                    fontSize: '0.9rem', 
                    fontFamily: 'Outfit, sans-serif',
                    color: 'var(--text-color, #1f2937)',
                    fontWeight: '500'
                  }} title={transaction.from}>
                    <Link 
                      to={`/${chainId}/address/${transaction.from}`}
                      style={{ 
                        color: '#10b981', 
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    >
                      {truncate(transaction.from)}
                    </Link>
                  </td>
                  <td style={{ 
                    fontSize: '0.9rem', 
                    fontFamily: 'Outfit, sans-serif',
                    color: 'var(--text-color, #1f2937)',
                    fontWeight: '500'
                  }} title={transaction.to}>
                    {transaction.to ? (
                      <Link 
                        to={`/${chainId}/address/${transaction.to}`}
                        style={{ 
                          color: '#10b981', 
                          fontWeight: '600',
                          textDecoration: 'none',
                          fontFamily: 'Outfit, sans-serif'
                        }}
                      >
                        {truncate(transaction.to)}
                      </Link>
                    ) : (
                      <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Contract Creation</span>
                    )}
                  </td>
                  <td style={{ 
                    fontWeight: '600', 
                    color: '#059669', 
                    fontSize: '0.95rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {formatValue(transaction.value)}
                  </td>
                  <td style={{ 
                    fontSize: '0.95rem', 
                    color: '#6b7280',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '500'
                  }}>
                    {formatGasPrice(transaction.gasPrice)}
                  </td>
                  <td style={{ 
                    fontSize: '0.95rem', 
                    color: '#6b7280',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '500'
                  }}>
                    {Number(transaction.gas).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
