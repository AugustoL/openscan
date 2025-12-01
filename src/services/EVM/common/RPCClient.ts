// src/services/EVM/common/RPCClient.ts
export interface RPCRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  params: any[];
}

// biome-ignore lint/suspicious/noExplicitAny: <TODO>
export interface RPCResponse<T = any> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    data?: any;
  };
}
// biome-ignore lint/suspicious/noExplicitAny: <TODO>
export interface ParallelRequestResult<T = any> {
  url: string;
  status: "fulfilled" | "rejected";
  response?: T;
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  error?: any;
}

export type RPCStrategy = "fallback" | "parallel";

export interface RPCClientConfig {
  rpcUrls: string | string[];
  strategy?: RPCStrategy;
}

export class RPCClient {
  private requestId = 0;
  private rpcUrls: string[];
  private currentUrlIndex = 0;
  private strategy: RPCStrategy = "fallback";

  constructor(config: string | string[] | RPCClientConfig) {
    // Support multiple constructor signatures for backwards compatibility
    if (typeof config === "string" || Array.isArray(config)) {
      // Legacy: just URLs provided
      this.rpcUrls = Array.isArray(config) ? config : [config];
      this.strategy = "fallback";
    } else {
      // New config object
      this.rpcUrls = Array.isArray(config.rpcUrls) ? config.rpcUrls : [config.rpcUrls];
      this.strategy = config.strategy || "fallback";
    }

    if (this.rpcUrls.length === 0) {
      throw new Error("At least one RPC URL must be provided");
    }
  }

  /**
   * Get the current RPC URL being used
   */
  getCurrentUrl(): string {
    // biome-ignore lint/style/noNonNullAssertion: <TODO>
    return this.rpcUrls[this.currentUrlIndex]!;
  }

  /**
   * Get all configured RPC URLs
   */
  getAllUrls(): string[] {
    return [...this.rpcUrls];
  }

  /**
   * Get the current request strategy
   */
  getStrategy(): RPCStrategy {
    return this.strategy;
  }

  /**
   * Set the request strategy
   * @param strategy - "fallback" for sequential fallback or "parallel" for parallel requests
   */
  setStrategy(strategy: RPCStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Make a single RPC request to a specific URL without fallback
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  private async makeRequest<T = any>(url: string, method: string, params: any[] = []): Promise<T> {
    const request: RPCRequest = {
      jsonrpc: "2.0",
      id: ++this.requestId,
      method,
      params,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
    }

    const data: RPCResponse<T> = await response.json();

    if (data.error) {
      throw new Error(`RPC error: ${data.error.message} (code: ${data.error.code})`);
    }

    if (data.result === undefined) {
      throw new Error("RPC response missing result");
    }

    return data.result;
  }

  /**
   * Attempt an RPC call with automatic fallback to other URLs on failure
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  private async callWithFallback<T = any>(
    method: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    params: any[] = [],
    urlIndex = 0,
    errors: Error[] = [],
  ): Promise<T> {
    if (urlIndex >= this.rpcUrls.length) {
      // All URLs have been tried, throw aggregate error
      const errorMessages = errors
        .map((e, i) => `  [${i + 1}] ${this.rpcUrls[i]}: ${e.message}`)
        .join("\n");
      throw new Error(`All RPC endpoints failed:\n${errorMessages}`);
    }

    const rpcUrl = this.rpcUrls[urlIndex];
    if (!rpcUrl) {
      throw new Error(`RPC URL at index ${urlIndex} is undefined`);
    }
    try {
      const result = await this.makeRequest<T>(rpcUrl, method, params);

      // Success! Update the current URL index for future calls
      this.currentUrlIndex = urlIndex;

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);

      // Try next URL
      return this.callWithFallback<T>(method, params, urlIndex + 1, errors);
    }
  }
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async call<T = any>(method: string, params: any[] = []): Promise<T> {
    console.log(
      `RPCClient.call: ${method}`,
      "params:",
      params,
      "strategy:",
      this.strategy,
      "using URLs:",
      this.rpcUrls,
    );

    // Use parallel strategy if configured
    if (this.strategy === "parallel") {
      const results = await this.parallelCall<T>(method, params);

      // Find the first successful result
      const successful = results.find((r) => r.status === "fulfilled");
      if (successful && successful.response !== undefined) {
        return successful.response;
      }

      // All failed - throw error with details
      const errorMessages = results
        .map((r) =>
          r.status === "rejected" ? `  ${r.url}: ${r.error?.message || "Unknown error"}` : null,
        )
        .filter(Boolean)
        .join("\n");
      throw new Error(`All RPC endpoints failed (parallel strategy):\n${errorMessages}`);
    }

    // Use fallback strategy (default)
    // Start with the current working URL, then try others if it fails
    const orderedIndices = [
      this.currentUrlIndex,
      ...Array.from({ length: this.rpcUrls.length }, (_, i) => i).filter(
        (i) => i !== this.currentUrlIndex,
      ),
    ];

    const errors: Error[] = [];
    for (const urlIndex of orderedIndices) {
      try {
        return await this.callWithFallback<T>(method, params, urlIndex, []);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("All RPC endpoints failed")) {
          throw error;
        }
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // This shouldn't be reached, but just in case
    throw new Error("Unexpected error in RPC call with fallback");
  }

  /**
   * Batch multiple RPC calls with fallback support
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async batchCall<T = any>(calls: Array<{ method: string; params: any[] }>): Promise<T[]> {
    const orderedIndices = [
      this.currentUrlIndex,
      ...Array.from({ length: this.rpcUrls.length }, (_, i) => i).filter(
        (i) => i !== this.currentUrlIndex,
      ),
    ];

    const allErrors: Error[] = [];

    for (const urlIndex of orderedIndices) {
      const rpcUrl = this.rpcUrls[urlIndex];
      if (!rpcUrl) {
        allErrors.push(new Error(`RPC URL at index ${urlIndex} is undefined`));
        continue;
      }

      try {
        const requests: RPCRequest[] = calls.map((call) => ({
          jsonrpc: "2.0",
          id: ++this.requestId,
          method: call.method,
          params: call.params,
        }));

        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requests),
        });

        if (!response.ok) {
          throw new Error(`RPC batch request failed: ${response.status} ${response.statusText}`);
        }

        const data: RPCResponse<T>[] = await response.json();

        const results = data.map((item) => {
          if (item.error) {
            throw new Error(`RPC error: ${item.error.message} (code: ${item.error.code})`);
          }
          return item.result as T;
        });

        // Success! Update current URL index
        this.currentUrlIndex = urlIndex;

        return results;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        allErrors.push(err);
        // Continue to next URL
      }
    }

    // All URLs failed
    const errorMessages = allErrors
      .map((e, i) => `  [${i + 1}] ${this.rpcUrls[i] || "unknown"}: ${e.message}`)
      .join("\n");
    throw new Error(`All RPC endpoints failed for batch call:\n${errorMessages}`);
  }

  /**
   * Send the same RPC request to all configured URLs in parallel
   * Returns detailed results for each endpoint including success/failure status
   *
   * @param method - The RPC method to call
   * @param params - The parameters for the RPC method
   * @returns Array of results containing the status and response/error for each URL
   */
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  async parallelCall<T = any>(
    method: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    params: any[] = [],
  ): Promise<ParallelRequestResult<T>[]> {
    console.log(
      `RPCClient.parallelCall: ${method}`,
      "params:",
      params,
      "to all URLs:",
      this.rpcUrls,
    );

    // Create a promise for each URL
    const promises = this.rpcUrls.map((url) => this.makeRequest<T>(url, method, params));

    // Execute all requests in parallel and wait for all to settle
    const results = await Promise.allSettled(promises);

    // Map the results to our typed format
    return results.map((result, index) => {
      // biome-ignore lint/style/noNonNullAssertion: <TODO>
      const url = this.rpcUrls[index]!;

      if (result.status === "fulfilled") {
        return {
          url,
          status: "fulfilled",
          response: result.value,
        };
      } else {
        return {
          url,
          status: "rejected",
          error:
            result.reason instanceof Error
              ? {
                  message: result.reason.message,
                  name: result.reason.name,
                  stack: result.reason.stack,
                }
              : result.reason,
        };
      }
    });
  }
}
