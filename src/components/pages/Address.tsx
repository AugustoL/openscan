import { useParams } from 'react-router-dom';
import { useDataService } from '../../hooks/useDataService';
import { useEffect, useState } from 'react';
import { Address as AddressType } from '../../types';
import AddressDisplay from '../common/AddressDisplay';
import Loader from '../common/Loader';

export default function Address() {
  const { chainId, address } = useParams<{ chainId?: string; address?: string }>();
  const numericChainId = Number(chainId) || 1;
  const dataService = useDataService(numericChainId);
  const [addressData, setAddressData] = useState<AddressType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataService || !address) {
      setLoading(false);
      return;
    }

    console.log('Fetching address data for:', address, 'on chain:', numericChainId);
    setLoading(true);
    setError(null);

    dataService
      .getAddress(address)
      .then(fetchedAddress => {
        console.log('Fetched address:', fetchedAddress);
        setAddressData(fetchedAddress);
      })
      .catch((err) => {
        console.error('Error fetching address:', err);
        setError(err.message || 'Failed to fetch address data');
      })
      .finally(() => setLoading(false));
  }, [dataService, address, numericChainId]);

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Address</h1>
        <Loader text="Loading address data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Address</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>Address</h1>
        <p>No address provided</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {addressData ? (
        <>
          <AddressDisplay address={addressData} addressHash={address} />
        </>
      ) : (
        <p>Address data not found</p>
      )}
    </div>
  );
}
