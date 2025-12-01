import type { RPCMetadata, RPCProviderResponse } from "../types";
import type { ParallelRequestResult } from "./EVM/common/RPCClient";

/**
 * Service for processing RPC parallel request metadata
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <TODO>
export class RPCMetadataService {
  /**
   * Convert parallel results to metadata structure
   */
  static createMetadata(results: ParallelRequestResult[], strategy: "parallel"): RPCMetadata {
    const responses: RPCProviderResponse[] = results.map((result) => ({
      url: result.url,
      status: result.status === "fulfilled" ? "success" : "error",
      responseTime: 0, // TODO: Add timing in future
      data: result.response,
      error: result.error?.message,
      hash: RPCMetadataService.hashData(result.response),
    }));

    const hasInconsistencies = RPCMetadataService.detectInconsistencies(responses);

    return {
      strategy,
      timestamp: Date.now(),
      responses,
      hasInconsistencies,
    };
  }

  /**
   * Generate hash of data for comparison
   * Uses JSON.stringify for simple but effective comparison
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  private static hashData(data: any): string {
    if (!data) return "";
    try {
      // Stringify for comparison
      // In production, might want to exclude certain fields (timestamps, etc.)
      return JSON.stringify(data);
    } catch (error) {
      console.warn("Failed to hash RPC data:", error);
      return "";
    }
  }

  /**
   * Detect if responses differ between providers
   */
  private static detectInconsistencies(responses: RPCProviderResponse[]): boolean {
    const successfulResponses = responses.filter((r) => r.status === "success");

    // Need at least 2 successful responses to compare
    if (successfulResponses.length <= 1) return false;

    const firstHash = successfulResponses[0]?.hash;
    if (!firstHash) return false;

    // Check if any other response has a different hash
    return successfulResponses.some((r) => r.hash !== firstHash);
  }
}
