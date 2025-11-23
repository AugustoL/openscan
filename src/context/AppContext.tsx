import { createContext, useState, ReactNode, useEffect } from "react";
import { useAccount } from "wagmi";
import { useWagmiConnection } from "../hooks/useWagmiConnection";
import { IAppContext, RpcUrlsContextType } from "../types";
import { getEffectiveRpcUrls, saveRpcUrlsToStorage } from "../utils/rpcStorage";
import {
	loadJsonFilesFromStorage,
	saveJsonFilesToStorage,
} from "../utils/artifactsStorage";

// Alias exported for use across the app where a shorter/consistent name is preferred
export type tRpcUrlsContextType = RpcUrlsContextType;

export const AppContext = createContext<IAppContext>({
	appReady: false,
	resourcesLoaded: false,
	isHydrated: false,
	rpcUrls: getEffectiveRpcUrls(),
	setRpcUrls: () => {},
	jsonFiles: loadJsonFilesFromStorage(),
	setJsonFiles: () => {},
});

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
	const [appReady, setAppReady] = useState<boolean>(false);
	const [resourcesLoaded, setResourcesLoaded] = useState<boolean>(false);
	const [isHydrated, setIsHydrated] = useState<boolean>(false);
	const [rpcUrls, setRpcUrlsState] = useState<RpcUrlsContextType>(() =>
		getEffectiveRpcUrls(),
	);
	const [jsonFiles, setJsonFilesState] = useState<Record<string, any>>(() =>
		loadJsonFilesFromStorage(),
	);

	const setRpcUrls = (next: RpcUrlsContextType) => {
		setRpcUrlsState(next);
		try {
			saveRpcUrlsToStorage(next as Record<number, string[]>);
		} catch (err) {
			console.warn("Failed to persist rpc urls", err);
		}
	};

	const setJsonFiles = (next: Record<string, any>) => {
		setJsonFilesState(next);
		try {
			saveJsonFilesToStorage(next);
		} catch (err) {
			console.warn("Failed to persist json files", err);
		}
	};

	const account = useAccount();
	const { isFullyConnected, address } = useWagmiConnection();

	// Mark as hydrated when component mounts (React has taken control)
	useEffect(() => {
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		const checkResourcesLoaded = () => {
			// Check if all critical resources are loaded
			const images = Array.from(document.images);
			const stylesheets = Array.from(
				document.querySelectorAll('link[rel="stylesheet"]'),
			);

			const allImagesLoaded = images.every((img) => img.complete);
			const allStylesheetsLoaded = stylesheets.every((link) => {
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
			}}
		>
			{children}
		</AppContext.Provider>
	);
};
