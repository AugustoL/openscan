import { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";

/**
 * Custom hook to track various aspects of app readiness
 */
export const useAppReady = () => {
	const { appReady, resourcesLoaded, isHydrated } = useContext(AppContext);

	return {
		// Individual loading states
		appReady, // App initialization complete
		resourcesLoaded, // All resources (images, stylesheets) loaded
		isHydrated, // React has hydrated the DOM

		// Computed states
		fullyReady: appReady && resourcesLoaded && isHydrated,
		domReady: document.readyState === "complete",

		// Utility functions
		onFullyReady: (callback: () => void) => {
			if (appReady && resourcesLoaded && isHydrated) {
				callback();
			}
		},
	};
};

/**
 * Hook to execute code when app is fully ready
 */
export const useOnAppReady = (callback: () => void, deps: any[] = []) => {
	const { fullyReady } = useAppReady();

	useEffect(() => {
		if (fullyReady) {
			callback();
		}
	}, [fullyReady, callback, ...deps]); // Include callback in dependencies
};
