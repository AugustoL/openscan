import { useParams } from 'react-router-dom';
import { useDataService } from '../../hooks/useDataService';
import { useEffect, useState } from 'react';
import { Transaction } from '../../types';
import TransactionDisplay from '../common/TransactionDisplay';
import Loader from '../common/Loader';

export default function Tx() {
  const { chainId, filter } = useParams<{ chainId?: string; filter?: string }>();
  
  const txHash = filter;
  const numericChainId = Number(chainId) || 1;
  
  const dataService = useDataService(numericChainId);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataService || !txHash) {
      setLoading(false);
      return;
    }
    
    console.log('Fetching transaction:', txHash, 'for chain:', numericChainId);
    setLoading(true);
    setError(null);
    
    dataService
      .getTransaction(txHash)
      .then(fetchedTransaction => {
        console.log('Fetched transaction:', fetchedTransaction);
        setTransaction(fetchedTransaction);
      })
      .catch((err) => {
        console.error('Error fetching transaction:', err);
        setError(err.message || 'Failed to fetch transaction');
      })
      .finally(() => setLoading(false));
  }, [dataService, txHash, numericChainId]);

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto',textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Transaction</h1>
        <Loader text="Loading transaction..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto',textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Transaction</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>     
      {transaction ? (
        <>
          <TransactionDisplay transaction={transaction} chainId={chainId} />
        </>
      ) : (
        <p>Transaction not found</p>
      )}
    </div>
  );
}
