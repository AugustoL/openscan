import { lazy, Suspense } from 'react';
import Loading from './common/Loading';

// Lazy load page components
const Home = lazy(() => import('./pages/Home'));
const ConnectWallet = lazy(() => import('./pages/ConnectWallet'));
const Chain = lazy(() => import('./pages/Chain'));
const Blocks = lazy(() => import('./pages/Blocks'));
const Block = lazy(() => import('./pages/Block'));
const Txs = lazy(() => import('./pages/Txs'));
const Tx = lazy(() => import('./pages/Tx'));
const Address = lazy(() => import('./pages/Address'));
const Mempool = lazy(() => import('./pages/Mempool'));
const Settings = lazy(() => import('./pages/Settings'));
const DevTools = lazy(() => import('./pages/DevTools'));
const About = lazy(() => import('./pages/About'));
const Artifacts = lazy(() => import('./pages/Artifacts'));

// Higher-order component to wrap lazy components with Suspense
export const withSuspense = (Component: React.ComponentType<any>) => {
  return function SuspenseWrapper(props: any) {
    return (
      <Suspense fallback={<Loading />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

// Export lazy components wrapped with Suspense
export const LazyHome = withSuspense(Home);
export const LazyConnectWallet = withSuspense(ConnectWallet);
export const LazyChain = withSuspense(Chain);
export const LazyBlocks = withSuspense(Blocks);
export const LazyBlock = withSuspense(Block);
export const LazyTxs = withSuspense(Txs);
export const LazyTx = withSuspense(Tx);
export const LazyAddress = withSuspense(Address);
export const LazyMempool = withSuspense(Mempool);
export const LazySettings = withSuspense(Settings);
export const LazyDevTools = withSuspense(DevTools);
export const LazyAbout = withSuspense(About);
export const LazyArtifacts = withSuspense(Artifacts);
// Default exports for backward compatibility
export {
  Home,
  ConnectWallet
};