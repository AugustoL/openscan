import { useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "rpc_selected_provider_";

/**
 * Hook to manage selected RPC provider per page
 * Persists selection in sessionStorage
 *
 * @param pageKey - Unique key for the page (e.g., "block_1_12345")
 * @returns [selectedProvider, setSelectedProvider] tuple
 */
export function useProviderSelection(
  pageKey: string,
): [string | null, (provider: string | null) => void] {
  const storageKey = `${STORAGE_KEY_PREFIX}${pageKey}`;

  const [selectedProvider, setSelectedProvider] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (selectedProvider) {
      try {
        sessionStorage.setItem(storageKey, selectedProvider);
      } catch (error) {
        console.warn("Failed to save provider selection:", error);
      }
    } else {
      try {
        sessionStorage.removeItem(storageKey);
      } catch (error) {
        console.warn("Failed to remove provider selection:", error);
      }
    }
  }, [selectedProvider, storageKey]);

  return [selectedProvider, setSelectedProvider];
}
