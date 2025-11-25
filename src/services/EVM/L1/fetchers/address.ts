// src/services/EVM/L1/fetchers/mainnet/address.ts
import { RPCClient } from "../../common/RPCClient";
import { TraceFilterResult, LogEntry, AddressTransactionsResult } from "../../../../types";

export class AddressFetcher {
	constructor(
		private rpcClient: RPCClient,
		private chainId: number,
	) {}

	async getBalance(
		address: string,
		blockNumber: number | "latest" = "latest",
	): Promise<bigint> {
		const blockParam =
			blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
		const result = await this.rpcClient.call<string>("eth_getBalance", [
			address,
			blockParam,
		]);
		return BigInt(result);
	}

	async getCode(
		address: string,
		blockNumber: number | "latest" = "latest",
	): Promise<string> {
		const blockParam =
			blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
		return await this.rpcClient.call<string>("eth_getCode", [
			address,
			blockParam,
		]);
	}

	async getTransactionCount(
		address: string,
		blockNumber: number | "latest" = "latest",
	): Promise<number> {
		const blockParam =
			blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
		const result = await this.rpcClient.call<string>(
			"eth_getTransactionCount",
			[address, blockParam],
		);
		return parseInt(result, 16);
	}

	async getStorageAt(
		address: string,
		position: string,
		blockNumber: number | "latest" = "latest",
	): Promise<string> {
		const blockParam =
			blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
		return await this.rpcClient.call<string>("eth_getStorageAt", [
			address,
			position,
			blockParam,
		]);
	}

	/**
	 * Get all transactions for an address using trace_filter
	 * This returns complete transaction history including internal calls
	 * Only supported on Erigon, Nethermind, Besu with tracing enabled
	 */
	async getTransactionsFromTrace(
		address: string,
		fromBlock: number | "earliest" = "earliest",
		toBlock: number | "latest" = "latest",
	): Promise<TraceFilterResult[]> {
		const fromBlockParam = fromBlock === "earliest" ? "earliest" : `0x${fromBlock.toString(16)}`;
		const toBlockParam = toBlock === "latest" ? "latest" : `0x${toBlock.toString(16)}`;

		// Get traces where address is sender
		const fromTraces = await this.rpcClient.call<TraceFilterResult[]>("trace_filter", [{
			fromBlock: fromBlockParam,
			toBlock: toBlockParam,
			fromAddress: [address],
		}]);

		// Get traces where address is receiver
		const toTraces = await this.rpcClient.call<TraceFilterResult[]>("trace_filter", [{
			fromBlock: fromBlockParam,
			toBlock: toBlockParam,
			toAddress: [address],
		}]);

		// Combine and deduplicate by transaction hash
		const allTraces = [...fromTraces, ...toTraces];
		return allTraces;
	}

	/**
	 * Get logs for an address using eth_getLogs
	 * This is a fallback when trace_filter is not available
	 * Only returns transactions that emitted events involving the address
	 */
	async getLogsForAddress(
		address: string,
		fromBlock: number | "earliest" = "earliest",
		toBlock: number | "latest" = "latest",
	): Promise<LogEntry[]> {
		const fromBlockParam = fromBlock === "earliest" ? "earliest" : `0x${fromBlock.toString(16)}`;
		const toBlockParam = toBlock === "latest" ? "latest" : `0x${toBlock.toString(16)}`;

		// Common event signatures for address-related events
		// Transfer: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
		// Approval: 0x8c5be1e5ebec7d5bd14f714f211d1fdf2f9d4b67e8936cfd6c3b6c0e16b3b4f2
		
		// Pad address to 32 bytes for topic filtering
		const paddedAddress = "0x" + address.toLowerCase().slice(2).padStart(64, "0");

		// Get logs where address is in topic1 (common for from/owner in Transfer/Approval)
		const logsAsTopic1 = await this.rpcClient.call<LogEntry[]>("eth_getLogs", [{
			fromBlock: fromBlockParam,
			toBlock: toBlockParam,
			topics: [null, paddedAddress],
		}]);

		// Get logs where address is in topic2 (common for to/spender in Transfer/Approval)
		const logsAsTopic2 = await this.rpcClient.call<LogEntry[]>("eth_getLogs", [{
			fromBlock: fromBlockParam,
			toBlock: toBlockParam,
			topics: [null, null, paddedAddress],
		}]);

		// Combine all logs
		return [...logsAsTopic1, ...logsAsTopic2];
	}

	/**
	 * Get address transactions - tries trace_filter first, falls back to logs
	 * Returns deduplicated transaction hashes with metadata about data source
	 */
	async getAddressTransactions(
		address: string,
		fromBlock: number | "earliest" = "earliest",
		toBlock: number | "latest" = "latest",
	): Promise<AddressTransactionsResult> {
		// Try trace_filter first (complete history)
		try {
			const traces = await this.getTransactionsFromTrace(address, fromBlock, toBlock);
			
			// Extract unique transaction hashes
			const txHashes = new Set<string>();
			for (const trace of traces) {
				if (trace.transactionHash) {
					txHashes.add(trace.transactionHash);
				}
			}

			// Sort by block number (most recent first)
			const sortedTraces = traces.sort((a, b) => b.blockNumber - a.blockNumber);
			const sortedHashes: string[] = [];
			const seen = new Set<string>();
			for (const trace of sortedTraces) {
				if (trace.transactionHash && !seen.has(trace.transactionHash)) {
					seen.add(trace.transactionHash);
					sortedHashes.push(trace.transactionHash);
				}
			}

			return {
				transactions: sortedHashes,
				source: "trace_filter",
				isComplete: true,
			};
		} catch (error: any) {
			// trace_filter not supported, try logs
			console.log("trace_filter not available, falling back to logs:", error.message);
		}

		// Fallback to eth_getLogs (partial history - only events)
		try {
			const logs = await this.getLogsForAddress(address, fromBlock, toBlock);
			
			// Extract unique transaction hashes
			const txHashes = new Set<string>();
			for (const log of logs) {
				if (log.transactionHash) {
					txHashes.add(log.transactionHash);
				}
			}

			// Sort by block number (most recent first)
			const sortedLogs = logs.sort((a, b) => 
				parseInt(b.blockNumber, 16) - parseInt(a.blockNumber, 16)
			);
			const sortedHashes: string[] = [];
			const seen = new Set<string>();
			for (const log of sortedLogs) {
				if (log.transactionHash && !seen.has(log.transactionHash)) {
					seen.add(log.transactionHash);
					sortedHashes.push(log.transactionHash);
				}
			}

			return {
				transactions: sortedHashes,
				source: "logs",
				isComplete: false,
				message: "Showing transactions from event logs only. ETH transfers and transactions without events are not included. Full history requires a node with trace_filter support.",
			};
		} catch (error: any) {
			console.error("eth_getLogs failed:", error.message);
		}

		// Neither method worked
		return {
			transactions: [],
			source: "none",
			isComplete: false,
			message: "Unable to fetch transaction history. The RPC endpoint does not support trace_filter or eth_getLogs queries.",
		};
	}

	getChainId(): number {
		return this.chainId;
	}
}
