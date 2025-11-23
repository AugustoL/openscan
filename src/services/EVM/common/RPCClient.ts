// src/services/EVM/common/RPCClient.ts
export interface RPCRequest {
	jsonrpc: "2.0";
	id: number;
	method: string;
	params: any[];
}

export interface RPCResponse<T = any> {
	jsonrpc: "2.0";
	id: number;
	result?: T;
	error?: {
		code: number;
		message: string;
		data?: any;
	};
}

export class RPCClient {
	private requestId = 0;
	private rpcUrls: string[];
	private currentUrlIndex = 0;

	constructor(rpcUrls: string | string[]) {
		// Support both single URL (backwards compatibility) and array of URLs
		this.rpcUrls = Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls];

		if (this.rpcUrls.length === 0) {
			throw new Error("At least one RPC URL must be provided");
		}
	}

	/**
	 * Get the current RPC URL being used
	 */
	getCurrentUrl(): string {
		return this.rpcUrls[this.currentUrlIndex]!;
	}

	/**
	 * Get all configured RPC URLs
	 */
	getAllUrls(): string[] {
		return [...this.rpcUrls];
	}

	/**
	 * Attempt an RPC call with automatic fallback to other URLs on failure
	 */
	private async callWithFallback<T = any>(
		method: string,
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

		const rpcUrl = this.rpcUrls[urlIndex]!;

		try {
			const request: RPCRequest = {
				jsonrpc: "2.0",
				id: ++this.requestId,
				method,
				params,
			};

			const response = await fetch(rpcUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
			});

			if (!response.ok) {
				throw new Error(
					`RPC request failed: ${response.status} ${response.statusText}`,
				);
			}

			const data: RPCResponse<T> = await response.json();

			if (data.error) {
				throw new Error(
					`RPC error: ${data.error.message} (code: ${data.error.code})`,
				);
			}

			if (data.result === undefined) {
				throw new Error("RPC response missing result");
			}

			// Success! Update the current URL index for future calls
			this.currentUrlIndex = urlIndex;

			return data.result;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			errors.push(err);

			// Try next URL
			return this.callWithFallback<T>(method, params, urlIndex + 1, errors);
		}
	}

	async call<T = any>(method: string, params: any[] = []): Promise<T> {
		console.log(
			`RPCClient.call: ${method}`,
			"params:",
			params,
			"using URLs:",
			this.rpcUrls,
		);
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
				if (
					error instanceof Error &&
					error.message.startsWith("All RPC endpoints failed")
				) {
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
	async batchCall<T = any>(
		calls: Array<{ method: string; params: any[] }>,
	): Promise<T[]> {
		const orderedIndices = [
			this.currentUrlIndex,
			...Array.from({ length: this.rpcUrls.length }, (_, i) => i).filter(
				(i) => i !== this.currentUrlIndex,
			),
		];

		const allErrors: Error[] = [];

		for (const urlIndex of orderedIndices) {
			const rpcUrl = this.rpcUrls[urlIndex]!;

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
					throw new Error(
						`RPC batch request failed: ${response.status} ${response.statusText}`,
					);
				}

				const data: RPCResponse<T>[] = await response.json();

				const results = data.map((item) => {
					if (item.error) {
						throw new Error(
							`RPC error: ${item.error.message} (code: ${item.error.code})`,
						);
					}
					return item.result!;
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
			.map(
				(e, i) => `  [${i + 1}] ${this.rpcUrls[i] || "unknown"}: ${e.message}`,
			)
			.join("\n");
		throw new Error(
			`All RPC endpoints failed for batch call:\n${errorMessages}`,
		);
	}
}
