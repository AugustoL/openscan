import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const Navbar = () => {
  const { address } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract chainId from the pathname (e.g., /1/blocks -> 1)
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const chainId = pathSegments[0] && !isNaN(Number(pathSegments[0])) ? pathSegments[0] : undefined;
  
  console.log('Navbar chainId from URL:', chainId, 'pathname:', location.pathname);

  const goToSettings = () => {
    navigate('/settings');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <ul>
          <li><Link to="/">Home</Link></li>
          {chainId && (
            <>
              <li><Link to={`/${chainId}/blocks`}>BLOCKS</Link></li>
              <li><Link to={`/${chainId}/txs`}>TRANSACTIONS</Link></li>
            </>
          )}
        </ul>
        <ul>
          <li>
            <button 
              onClick={() => navigate('/help')} 
              className="navbar-toggle-btn"
              aria-label="Help"
              title="Help & Support"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('/about')} 
              className="navbar-toggle-btn"
              aria-label="About"
              title="About"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </li>
          <li>
            <button 
              onClick={() => goToSettings()} 
              className="navbar-toggle-btn"
              aria-label="Settings"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </li>
          {/* <li>
            <ConnectButton
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </li> */}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
