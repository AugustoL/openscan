import { BrowserRouter as Router, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useCallback } from 'react';

// Detect if we're running on GitHub Pages and get the correct basename
function getBasename(): string {
  const { hostname, pathname } = window.location;
  
  // Check if we're on GitHub Pages
  if (hostname.includes('github.io')) {
    // Extract repo name from pathname (first segment after domain)
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      return `/${pathSegments[0]}`;
    }
  }
  
  // For local development or custom domains, no basename needed
  return '';
}
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import NotificationDisplay from './components/common/NotificationDisplay';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/styles.css';
import { useAppReady, useOnAppReady } from './hooks/useAppReady';
import Loading from './components/common/Loading';
import {
  LazyHome,
  LazyConnectWallet,
  LazyChain,
  LazyBlocks,
  LazyBlock,
  LazyTxs,
  LazyTx,
  LazyAddress,
  LazyMempool, 
  LazySettings,
  LazyDevTools,
  LazyAbout,
  LazyArtifacts
} from './components/LazyComponents';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider, useTheme } from './context/SettingsContext';

// Detect GH Pages once
const isGhPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

// Separate component that uses the theme context
function AppContent() {
  const onAppReadyCallback = useCallback(async () => {
  }, []);

  useOnAppReady(onAppReadyCallback);

  const { fullyReady } = useAppReady();
  const { isDarkMode } = useTheme(); // Now this is inside ThemeProvider
  
  return (
    <>
      {!fullyReady ? (
          <Loading />
        ) : (
        <div className="app-content">
          <Navbar />
          <NotificationDisplay />
          <Routes>
            <Route path="/" element={<LazyHome />} />
            <Route path="settings" element={<LazySettings />} />
            <Route path="about" element={<LazyAbout />} />
            <Route path="hardhatartifacts" element={<LazyArtifacts />} />
            <Route path="devtools" element={<LazyDevTools />} />
            <Route path=":chainId" element={<LazyChain />} />
            <Route path=":chainId/blocks" element={<LazyBlocks />} />
            <Route path=":chainId/block/:filter" element={<LazyBlock />} />
            <Route path=":chainId/txs" element={<LazyTxs />} />
            <Route path=":chainId/tx/:filter" element={<LazyTx />} />
            <Route path=":chainId/address/:address" element={<LazyAddress />} />
            <Route path=":chainId/mempool" element={<LazyMempool />} />
            <Route path=":chainId/mempool/:filter" element={<LazyTx />} />
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
          <Footer />
        </div>
      )}
    </>
  );
}

// Main App component that provides the theme context
function App() {
  const BaseRouter = isGhPages ? HashRouter : Router;
  // IMPORTANT: no basename for HashRouter
  const basename = isGhPages ? '' : getBasename();

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <SettingsProvider>
          <BaseRouter basename={basename}>
            <AppContent />
          </BaseRouter>
        </SettingsProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;