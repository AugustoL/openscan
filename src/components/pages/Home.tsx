import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">OPENSCAN</h1>
        
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginTop: '40px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link 
            to="/1"
            style={{
              padding: '16px 32px',
              background: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: '2px solid #059669',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s ease',
              minWidth: '150px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.2)';
            }}
          >
            Mainnet
          </Link>

          <Link 
            to="/11155111"
            style={{
              padding: '16px 32px',
              background: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: '2px solid #059669',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s ease',
              minWidth: '150px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.2)';
            }}
          >
            Sepolia
          </Link>

          <Link 
            to="/31337"
            style={{
              padding: '16px 32px',
              background: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: '2px solid #059669',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s ease',
              minWidth: '150px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.2)';
            }}
          >
            Hardhat
          </Link>
        </div>
      </div>
    </div>
  );
};