import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { getAllNetworks, getNetworkByChainId, loadNetworks } from "../config/networks";
import { useWagmiConnection } from "../hooks/useWagmiConnection";
import type { IAppContext, NetworkConfig, RpcUrlsContextType } from "../types";
import { loadJsonFilesFromStorage, saveJsonFilesToStorage } from "../utils/artifactsStorage";
import { getEffectiveRpcUrls, saveRpcUrlsToStorage } from "../utils/rpcStorage";

// Alias exported for use across the app where a shorter/consistent name is preferred
export type tRpcUrlsContextType = RpcUrlsContextType;

export const AppContext = createContext<IAppContext>({
  appReady: false,
  resourcesLoaded: false,
  isHydrated: false,
  rpcUrls: {},
  setRpcUrls: () => {},
  jsonFiles: loadJsonFilesFromStorage(),
  setJsonFiles: () => {},
  // Network defaults
  networks: [],
  enabledNetworks: [],
  networksLoading: true,
  networksError: null,
  getNetwork: () => undefined,
  reloadNetworks: async () => {},
});

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [appReady, setAppReady] = useState<boolean>(false);
  const [resourcesLoaded, setResourcesLoaded] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [rpcUrls, setRpcUrlsState] = useState<RpcUrlsContextType>({} as RpcUrlsContextType);
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  const [jsonFiles, setJsonFilesState] = useState<Record<string, any>>(() =>
    loadJsonFilesFromStorage(),
  );

  // Network state
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [networksLoading, setNetworksLoading] = useState(true);
  const [networksError, setNetworksError] = useState<string | null>(null);

  // Derive enabled networks from networks state
  const enabledNetworks = useMemo(() => {
    const envNetworks = process.env.REACT_APP_OPENSCAN_NETWORKS;

    if (!envNetworks || envNetworks.trim() === "") {
      return networks;
    }

    // Parse comma-separated chain IDs
    const enabledChainIds = envNetworks
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !Number.isNaN(id));

    if (enabledChainIds.length === 0) {
      return networks;
    }

    // Filter networks by enabled chain IDs, maintaining order from env var
    const filtered: NetworkConfig[] = [];
    for (const chainId of enabledChainIds) {
      const network = networks.find((n) => n.chainId === chainId);
      if (network) {
        filtered.push(network);
      }
    }

    return filtered.length > 0 ? filtered : networks;
  }, [networks]);

  const setRpcUrls = (next: RpcUrlsContextType) => {
    setRpcUrlsState(next);
    try {
      saveRpcUrlsToStorage(next);
    } catch (err) {
      console.warn("Failed to persist rpc urls", err);
    }
  };

  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  const setJsonFiles = (next: Record<string, any>) => {
    setJsonFilesState(next);
    try {
      saveJsonFilesToStorage(next);
    } catch (err) {
      console.warn("Failed to persist json files", err);
    }
  };

  // Load networks from metadata
  const loadNetworkData = async () => {
    setNetworksLoading(true);
    setNetworksError(null);

    try {
      const loadedNetworks = await loadNetworks();
      setNetworks(loadedNetworks);
      // Update RPC URLs with the newly loaded network defaults
      setRpcUrlsState(getEffectiveRpcUrls());
    } catch (err) {
      setNetworksError(err instanceof Error ? err.message : "Failed to load networks");
      setNetworks(getAllNetworks());
    } finally {
      setNetworksLoading(false);
    }
  };

  const _account = useAccount();
  const { isFullyConnected, address } = useWagmiConnection();

  // Mark as hydrated when component mounts (React has taken control)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Load networks on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run once on mount
  useEffect(() => {
    loadNetworkData();
  }, []);

  useEffect(() => {
    const checkResourcesLoaded = () => {
      // Check if all critical resources are loaded
      const images = Array.from(document.images);
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

      const allImagesLoaded = images.every((img) => img.complete);
      const allStylesheetsLoaded = stylesheets.every((_link) => {
        // For external stylesheets, we assume they're loaded if the element exists
        return true; // You can add more sophisticated checking if needed
      });

      if (allImagesLoaded && allStylesheetsLoaded) {
        setResourcesLoaded(true);
      }
    };

    // Check immediately
    checkResourcesLoaded();

    // Also check after a short delay to catch any resources that might still be loading
    const timer = setTimeout(checkResourcesLoaded, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for DOM to be ready
        if (document.readyState !== "complete") {
          await new Promise((resolve) => {
            if (document.readyState === "complete") {
              resolve(true);
            } else {
              window.addEventListener("load", () => resolve(true), {
                once: true,
              });
            }
          });
        }

        if (isFullyConnected && address) {
          //
        }

        // Mark app as ready
        setAppReady(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        setAppReady(true); // Still mark as ready even if there's an error
      }
    };

    initializeApp();
  }, [isFullyConnected, address]);

  return (
    <AppContext.Provider
      value={{
        appReady,
        resourcesLoaded,
        isHydrated,
        rpcUrls,
        setRpcUrls,
        jsonFiles,
        setJsonFiles,
        // Network values
        networks,
        enabledNetworks,
        networksLoading,
        networksError,
        getNetwork: getNetworkByChainId,
        reloadNetworks: loadNetworkData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook to use networks from AppContext
export function useNetworks() {
  const context = useContext(AppContext);
  return {
    networks: context.networks,
    enabledNetworks: context.enabledNetworks,
    isLoading: context.networksLoading,
    error: context.networksError,
    getNetwork: context.getNetwork,
    reload: context.reloadNetworks,
  };
}

export function useNetwork(chainId: number): NetworkConfig | undefined {
  const { getNetwork } = useNetworks();
  return getNetwork(chainId);
}
