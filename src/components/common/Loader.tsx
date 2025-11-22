import React from 'react';

interface LoaderProps {
  size?: number;
  color?: string;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 40, 
  color = '#10b981',
  text 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `3px solid rgba(16, 185, 129, 0.2)`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {text && (
        <p style={{
          marginTop: '12px',
          color: '#6b7280',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '0.9rem'
        }}>
          {text}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
