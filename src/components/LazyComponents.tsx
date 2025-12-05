import { lazy, Suspense } from "react";
import Loading from "./common/Loading";

// Lazy load page components
const Home = lazy(() => import("./pages/home"));
const Chain = lazy(() => import("./pages/network"));
const Blocks = lazy(() => import("./pages/blocks"));
const Block = lazy(() => import("./pages/block"));
const Txs = lazy(() => import("./pages/txs"));
const Tx = lazy(() => import("./pages/tx"));
const Address = lazy(() => import("./pages/address"));
const TokenDetails = lazy(() => import("./pages/tokenDetails"));
const Mempool = lazy(() => import("./pages/mempool"));
const Settings = lazy(() => import("./pages/settings"));
const DevTools = lazy(() => import("./pages/devtools"));
const About = lazy(() => import("./pages/about"));
const Subscriptions = lazy(() => import("./pages/subscriptions"));
const Profile = lazy(() => import("./pages/profile"));
const Supporters = lazy(() => import("./pages/supporters"));

// Higher-order component to wrap lazy components with Suspense
// biome-ignore lint/suspicious/noExplicitAny: <TODO>
export const withSuspense = (Component: React.ComponentType<any>) => {
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
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
export const LazyChain = withSuspense(Chain);
export const LazyBlocks = withSuspense(Blocks);
export const LazyBlock = withSuspense(Block);
export const LazyTxs = withSuspense(Txs);
export const LazyTx = withSuspense(Tx);
export const LazyAddress = withSuspense(Address);
export const LazyTokenDetails = withSuspense(TokenDetails);
export const LazyMempool = withSuspense(Mempool);
export const LazySettings = withSuspense(Settings);
export const LazyDevTools = withSuspense(DevTools);
export const LazyAbout = withSuspense(About);
export const LazySubscriptions = withSuspense(Subscriptions);
export const LazyProfile = withSuspense(Profile);
export const LazySupporters = withSuspense(Supporters);
// Default exports for backward compatibility
export { Home };
