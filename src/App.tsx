import { darkTheme, lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback } from "react";
import { HashRouter, Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { networkConfig } from "./utils/networkConfig";
import "./styles/rainbowkit.css";

// Detect if we're running on GitHub Pages and get the correct basename
function getBasename(): string {
  const { hostname, pathname } = window.location;

  // Check if we're on GitHub Pages
  if (hostname.includes("github.io")) {
    // Extract repo name from pathname (first segment after domain)
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      return `/${pathSegments[0]}`;
    }
  }

  // For local development or custom domains, no basename needed
  return "";
}

import ErrorBoundary from "./components/common/ErrorBoundary";
import Footer from "./components/common/Footer";
import { IsometricBlocks } from "./components/common/IsometricBlocks";
import Navbar from "./components/common/Navbar";
import NotificationDisplay from "./components/common/NotificationDisplay";
import "./styles/styles.css";
import "./styles/layouts.css";
import "./styles/components.css";
import "./styles/tables.css";
import "./styles/forms.css";
import Loading from "./components/common/Loading";
import {
  LazyAbout,
  LazyAddress,
  LazyBlock,
  LazyBlocks,
  LazyChain,
  LazyDevTools,
  LazyHome,
  LazyMempool,
  LazySettings,
  LazySubscriptions,
  LazyTx,
  LazyTxs,
} from "./components/LazyComponents";
import { NotificationProvider } from "./context/NotificationContext";
import { SettingsProvider, useSettings, useTheme } from "./context/SettingsContext";
import { useAppReady, useOnAppReady } from "./hooks/useAppReady";

// Detect GH Pages once
const isGhPages = typeof window !== "undefined" && window.location.hostname.includes("github.io");

// Create a client for React Query
const queryClient = new QueryClient();

// Separate component that uses the theme context
function AppContent() {
  const onAppReadyCallback = useCallback(async () => {}, []);

  useOnAppReady(onAppReadyCallback);

  const { fullyReady } = useAppReady();
  const { settings } = useSettings();

  return (
    <>
      {!fullyReady ? (
        <Loading />
      ) : (
        <>
          {/* Background animated blocks - full screen (conditionally rendered) */}
          {settings.showBackgroundBlocks && (
            <div className="app-background-blocks">
              <IsometricBlocks
                width={window.innerWidth}
                height={window.innerHeight}
                cubeSize={32}
                maxCubes={80}
                spawnInterval={100}
              />
            </div>
          )}

          <div className="app-content">
            <Navbar />
            <NotificationDisplay />
            <Routes>
              <Route path="/" element={<LazyHome />} />
              <Route path="settings" element={<LazySettings />} />
              <Route path="about" element={<LazyAbout />} />
              <Route path="devtools" element={<LazyDevTools />} />
              <Route path="subscriptions" element={<LazySubscriptions />} />
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
        </>
      )}
    </>
  );
}

// Main App component that provides the theme context
function App() {
  const BaseRouter = isGhPages ? HashRouter : Router;
  // IMPORTANT: no basename for HashRouter
  const basename = isGhPages ? "" : getBasename();

  return (
    <ErrorBoundary>
      <WagmiProvider config={networkConfig}>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <SettingsProvider>
              <RainbowKitProviderWrapper>
                <BaseRouter basename={basename}>
                  <AppContent />
                </BaseRouter>
              </RainbowKitProviderWrapper>
            </SettingsProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

// Wrapper component to use theme inside SettingsProvider
function RainbowKitProviderWrapper({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useTheme();

  return (
    <RainbowKitProvider theme={isDarkMode ? darkTheme() : lightTheme()}>
      {children}
    </RainbowKitProvider>
  );
}

export default App;
