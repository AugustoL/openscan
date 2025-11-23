// src/services/EVM/L1/fetchers/trace.ts
import { RPCClient } from "../../common/RPCClient";

export interface TraceLog {
	pc: number;
	op: string;
	gas: number;
	gasCost: number;
	depth: number;
	stack: string[];
	memory?: string[];
	storage?: Record<string, string>;
}

export interface TraceResult {
	gas: number;
	failed: boolean;
	returnValue: string;
	structLogs: TraceLog[];
}

export interface TraceCallConfig {
	tracer?: string;
	timeout?: string;
	tracerConfig?: {
		onlyTopCall?: boolean;
		withLog?: boolean;
	};
}

export class TraceFetcher {
	constructor(private rpcClient: RPCClient) {}

	/**
	 * Trace a transaction execution
	 */
	async traceTransaction(
		txHash: string,
		config?: TraceCallConfig,
	): Promise<TraceResult> {
		try {
			const result = await this.rpcClient.call<TraceResult>(
				"debug_traceTransaction",
				[txHash, config || {}],
			);
			return result;
		} catch (error) {
			console.error("Error tracing transaction:", error);
			throw error;
		}
	}

	/**
	 * Trace a call without sending it to the network
	 */
	async traceCall(
		transaction: {
			from?: string;
			to: string;
			gas?: string;
			gasPrice?: string;
			value?: string;
			data?: string;
		},
		blockNumber: string | "latest",
		config?: TraceCallConfig,
	): Promise<TraceResult> {
		try {
			const result = await this.rpcClient.call<TraceResult>("debug_traceCall", [
				transaction,
				blockNumber,
				config || {},
			]);
			return result;
		} catch (error) {
			console.error("Error tracing call:", error);
			throw error;
		}
	}

	/**
	 * Trace all transactions in a block
	 */
	async traceBlockByNumber(
		blockNumber: string | number,
		config?: TraceCallConfig,
	): Promise<TraceResult[]> {
		try {
			const blockNum =
				typeof blockNumber === "number"
					? `0x${blockNumber.toString(16)}`
					: blockNumber;

			const result = await this.rpcClient.call<any>(
				"debug_traceBlockByNumber",
				[blockNum, config || {}],
			);

			// Hardhat returns an array directly
			// Geth might return an object with tx hashes as keys
			if (Array.isArray(result)) {
				return result;
			} else if (result && typeof result === "object") {
				// Convert object to array of traces
				return Object.values(result);
			}

			return [];
		} catch (error) {
			console.error("Error tracing block:", error);
			throw error;
		}
	}

	/**
	 * Trace block by hash
	 */
	async traceBlockByHash(
		blockHash: string,
		config?: TraceCallConfig,
	): Promise<TraceResult[]> {
		try {
			const result = await this.rpcClient.call<any>("debug_traceBlockByHash", [
				blockHash,
				config || {},
			]);

			// Hardhat returns an array directly
			// Geth might return an object with tx hashes as keys
			if (Array.isArray(result)) {
				return result;
			} else if (result && typeof result === "object") {
				// Convert object to array of traces
				return Object.values(result);
			}

			return [];
		} catch (error) {
			console.error("Error tracing block by hash:", error);
			throw error;
		}
	}

	/**
	 * Check if trace methods are available (localhost detection)
	 */
	async isTraceAvailable(): Promise<boolean> {
		try {
			// Try a simple trace call to see if it's supported
			await this.rpcClient.call("debug_traceTransaction", [
				"0x0000000000000000000000000000000000000000000000000000000000000000",
				{},
			]);
			return true;
		} catch (error) {
			// If the method doesn't exist or returns an error, traces aren't available
			return false;
		}
	}

	/**
	 * Get simplified call trace for UI display
	 */
	async getCallTrace(txHash: string): Promise<{
		calls: Array<{
			type: string;
			from: string;
			to: string;
			value: string;
			gas: number;
			gasUsed: number;
			input: string;
			output: string;
			error?: string;
			calls?: any[];
		}>;
		gasUsed: number;
		failed: boolean;
	} | null> {
		try {
			const trace = await this.traceTransaction(txHash, {
				tracer: "callTracer",
				tracerConfig: {
					onlyTopCall: false,
					withLog: true,
				},
			});

			return trace as any;
		} catch (error) {
			console.error("Error getting call trace:", error);
			return null;
		}
	}

	/**
	 * Get opcode-level trace for detailed debugging
	 */
	async getOpcodeTrace(txHash: string): Promise<TraceResult | null> {
		try {
			return await this.traceTransaction(txHash);
		} catch (error) {
			console.error("Error getting opcode trace:", error);
			return null;
		}
	}
}
