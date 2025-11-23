// src/services/EVM/common/TraceService.ts
import { RPCClient } from "./RPCClient";

export interface TraceLog {
	pc: number;
	op: string;
	gas: number;
	gasCost: number;
	depth: number;
	stack: string[];
	memory: string[];
	storage: Record<string, string>;
}

export interface StructLog extends TraceLog {
	error?: string;
}

export interface TransactionTrace {
	gas: number;
	returnValue: string;
	structLogs: StructLog[];
	failed?: boolean;
	revertReason?: string;
}

export interface CallTrace {
	type: string;
	from: string;
	to: string;
	value: string;
	gas: string;
	gasUsed: string;
	input: string;
	output: string;
	error?: string;
	calls?: CallTrace[];
}

export class TraceService {
	constructor(private rpcClient: RPCClient) {}

	/**
	 * Trace a transaction with detailed execution logs
	 */
	async traceTransaction(
		txHash: string,
		tracerConfig?: any,
	): Promise<TransactionTrace | null> {
		try {
			const result = await this.rpcClient.call("debug_traceTransaction", [
				txHash,
				tracerConfig || {
					disableMemory: false,
					disableStack: false,
					disableStorage: false,
				},
			]);
			return result;
		} catch (error) {
			console.error("Error tracing transaction:", error);
			return null;
		}
	}

	/**
	 * Trace a call without executing it on-chain
	 */
	async traceCall(
		callObject: {
			from?: string;
			to: string;
			gas?: string;
			gasPrice?: string;
			value?: string;
			data?: string;
		},
		blockNumber: string | "latest" = "latest",
		tracerConfig?: any,
	): Promise<TransactionTrace | null> {
		try {
			const result = await this.rpcClient.call("debug_traceCall", [
				callObject,
				blockNumber,
				tracerConfig || {
					disableMemory: false,
					disableStack: false,
					disableStorage: false,
				},
			]);
			return result;
		} catch (error) {
			console.error("Error tracing call:", error);
			return null;
		}
	}

	/**
	 * Trace all transactions in a block by number
	 */
	async traceBlockByNumber(
		blockNumber: number | "latest",
	): Promise<TransactionTrace[] | null> {
		try {
			const blockParam =
				blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
			const result = await this.rpcClient.call("debug_traceBlockByNumber", [
				blockParam,
				{ disableMemory: false, disableStack: false, disableStorage: false },
			]);
			return result;
		} catch (error) {
			console.error("Error tracing block:", error);
			return null;
		}
	}

	/**
	 * Trace all transactions in a block by hash
	 */
	async traceBlockByHash(
		blockHash: string,
	): Promise<TransactionTrace[] | null> {
		try {
			const result = await this.rpcClient.call("debug_traceBlockByHash", [
				blockHash,
				{ disableMemory: false, disableStack: false, disableStorage: false },
			]);
			return result;
		} catch (error) {
			console.error("Error tracing block by hash:", error);
			return null;
		}
	}

	/**
	 * Get call trace tree (callTracer)
	 */
	async getCallTrace(txHash: string): Promise<CallTrace | null> {
		try {
			const result = await this.rpcClient.call("debug_traceTransaction", [
				txHash,
				{ tracer: "callTracer" },
			]);
			return result;
		} catch (error) {
			console.error("Error getting call trace:", error);
			return null;
		}
	}

	/**
	 * Get prestate trace (shows state before execution)
	 */
	async getPrestateTrace(txHash: string): Promise<any> {
		try {
			const result = await this.rpcClient.call("debug_traceTransaction", [
				txHash,
				{ tracer: "prestateTracer" },
			]);
			return result;
		} catch (error) {
			console.error("Error getting prestate trace:", error);
			return null;
		}
	}

	/**
	 * Check if debug/trace methods are available
	 */
	async isTraceAvailable(): Promise<boolean> {
		try {
			// Try a simple trace call to check availability
			await this.rpcClient.call("web3_clientVersion", []);
			return true;
		} catch (error) {
			return false;
		}
	}
}
