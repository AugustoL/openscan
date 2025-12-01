import { useMemo } from "react";
import type { DataWithMetadata } from "../types";

/**
 * Hook to extract the correct data based on selected provider
 * Handles fallback mode, default selection, and explicit provider selection
 *
 * @param result - The data with metadata from DataService
 * @param selectedProvider - The URL of the selected provider (or null for default)
 * @returns The actual data to display
 */
export function useSelectedData<T>(
  result: DataWithMetadata<T> | null,
  selectedProvider: string | null,
): T | null {
  return useMemo(() => {
    if (!result) {
      return null;
    }

    // No metadata = fallback mode, return data as-is
    if (!result.metadata) {
      return result.data;
    }

    // No provider selected = use default (first successful)
    if (!selectedProvider) {
      return result.data;
    }

    // Find selected provider's response
    const providerResponse = result.metadata.responses.find(
      (r) => r.url === selectedProvider && r.status === "success",
    );

    if (!providerResponse || !providerResponse.data) {
      // Fallback to default if selected provider not found
      console.warn(`Selected provider ${selectedProvider} not found or failed, using default`);
      return result.data;
    }

    // Return the selected provider's data
    return providerResponse.data;
  }, [result, selectedProvider]);
}
