// src/services/EVM/Optimism/fetchers/address.ts
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
	 * Note: Optimism/Base public RPCs typically do not support trace_filter
	 */
	async getTransactionsFromTrace(
		address: string,
		fromBlock: number | "earliest" = "earliest",
		toBlock: number | "latest" = "latest",
	): Promise<TraceFilterResult[]> {
		const fromBlockParam = fromBlock === "earliest" ? "earliest" : `0x${fromBlock.toString(16)}`;
		const toBlockParam = toBlock === "latest" ? "latest" : `0x${toBlock.toString(16)}`;

		const fromTraces = await this.rpcClient.call<TraceFilterResult[]>("trace_filter", [{
			fromBlock: fromBlockParam,
			toBlock: toBlockParam,
			fromAddress: [address],
		}]);

		const toTraces = await this.rpcClient.call<TraceFilterResult[]>("trace_filter", [{
			fromBlock: fromBlockParam,
			toBlock: toBlockParam,
			toAddress: [address],
		}]);

		return [...fromTraces, ...toTraces];
	}

	/**
	 * Get logs for an address using eth_getLogs
	 */
	async getLogsForAddress(
		address: string,
		fromBlock: number | "earliest" = "earliest",
		toBlock: number | "latest" = "latest",
	): Promise<LogEntry[]> {
		const fromBlockParam = fromBlock === "earliest" ? "earliest" : `0x${fromBlock.toString(16)}`;
		const toBlockParam = toBlock === "latest" ? "latest" : `0x${toBlock.toString(16)}`;
		const paddedAddress = "0x" + address.toLowerCase().slice(2).padStart(64, "0");

		const logsAsTopic1 = await this.rpcClient.call<LogEntry[]>("eth_getLogs", [{
			fromBlock: fromBlockParam,
			toBlock: toBlockParam,
			topics: [null, paddedAddress],
		}]);

		const logsAsTopic2 = await this.rpcClient.call<LogEntry[]>("eth_getLogs", [{
			fromBlock: fromBlockParam,
			toBlock: toBlockParam,
			topics: [null, null, paddedAddress],
		}]);

		return [...logsAsTopic1, ...logsAsTopic2];
	}

	/**
	 * Get address transactions - tries trace_filter first, falls back to logs
	 */
	async getAddressTransactions(
		address: string,
		fromBlock: number | "earliest" = "earliest",
		toBlock: number | "latest" = "latest",
	): Promise<AddressTransactionsResult> {
		try {
			const traces = await this.getTransactionsFromTrace(address, fromBlock, toBlock);
			
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
			console.log("trace_filter not available on Optimism/Base, falling back to logs:", error.message);
		}

		try {
			const logs = await this.getLogsForAddress(address, fromBlock, toBlock);
			
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
				message: "Showing transactions from event logs only. ETH transfers and transactions without events are not included.",
			};
		} catch (error: any) {
			console.error("eth_getLogs failed on Optimism/Base:", error.message);
		}

		return {
			transactions: [],
			source: "none",
			isComplete: false,
			message: "Unable to fetch transaction history on this L2 chain.",
		};
	}

	getChainId(): number {
		return this.chainId;
	}
}
