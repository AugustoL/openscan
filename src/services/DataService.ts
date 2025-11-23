// src/services/DataService.ts
import { RPCClient } from "./EVM/common/RPCClient";
import { getRPCUrls } from "../config/rpcConfig";
import { BlockFetcher } from "./EVM/L1/fetchers/block";
import { TransactionFetcher } from "./EVM/L1/fetchers/transaction";
import { AddressFetcher } from "./EVM/L1/fetchers/address";
import { NetworkStatsFetcher } from "./EVM/L1/fetchers/networkStats";
import { TraceFetcher, TraceResult } from "./EVM/L1/fetchers/trace";
import { BlockAdapter } from "./EVM/L1/adapters/block";
import { TransactionAdapter } from "./EVM/L1/adapters/transaction";
import { AddressAdapter } from "./EVM/L1/adapters/address";
// Arbitrum imports
import { BlockFetcher as BlockFetcherArbitrum } from "./EVM/Arbitrum/fetchers/block";
import { TransactionFetcher as TransactionFetcherArbitrum } from "./EVM/Arbitrum/fetchers/transaction";
import { AddressFetcher as AddressFetcherArbitrum } from "./EVM/Arbitrum/fetchers/address";
import { NetworkStatsFetcher as NetworkStatsFetcherArbitrum } from "./EVM/Arbitrum/fetchers/networkStats";
import { BlockArbitrumAdapter } from "./EVM/Arbitrum/adapters/block";
import { TransactionArbitrumAdapter } from "./EVM/Arbitrum/adapters/transaction";
import { AddressAdapter as AddressAdapterArbitrum } from "./EVM/Arbitrum/adapters/address";
// Optimism imports
import { BlockFetcher as BlockFetcherOptimism } from "./EVM/Optimism/fetchers/block";
import { TransactionFetcher as TransactionFetcherOptimism } from "./EVM/Optimism/fetchers/transaction";
import { AddressFetcher as AddressFetcherOptimism } from "./EVM/Optimism/fetchers/address";
import { NetworkStatsFetcher as NetworkStatsFetcherOptimism } from "./EVM/Optimism/fetchers/networkStats";
import { BlockOptimismAdapter } from "./EVM/Optimism/adapters/block";
import { TransactionOptimismAdapter } from "./EVM/Optimism/adapters/transaction";
import { AddressAdapter as AddressAdapterOptimism } from "./EVM/Optimism/adapters/address";
import type {
	Block,
	Transaction,
	Address,
	NetworkStats,
	RpcUrlsContextType,
} from "../types";

interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

export class DataService {
	private rpcClient: RPCClient;
	private blockFetcher:
		| BlockFetcher
		| BlockFetcherArbitrum
		| BlockFetcherOptimism;
	private transactionFetcher:
		| TransactionFetcher
		| TransactionFetcherArbitrum
		| TransactionFetcherOptimism;
	private addressFetcher:
		| AddressFetcher
		| AddressFetcherArbitrum
		| AddressFetcherOptimism;
	private networkStatsFetcher:
		| NetworkStatsFetcher
		| NetworkStatsFetcherArbitrum
		| NetworkStatsFetcherOptimism;
	private traceFetcher: TraceFetcher;
	private isArbitrum: boolean;
	private isOptimism: boolean;
	private isLocalhost: boolean;

	// Simple in-memory cache with chainId in key
	private cache = new Map<string, CacheEntry<any>>();
	private cacheTimeout = 30000; // 30 seconds

	constructor(
		private chainId: number,
		rpcUrlsMap: RpcUrlsContextType,
	) {
		console.log("DataService constructor called with chainId:", chainId);
		const rpcUrls = getRPCUrls(chainId, rpcUrlsMap);
		console.log("RPC URLs for chain", chainId, ":", rpcUrls);
		this.rpcClient = new RPCClient(rpcUrls);

		// Check which network we're on
		this.isArbitrum = chainId === 42161;
		this.isOptimism = chainId === 10;
		this.isLocalhost = chainId === 31337;

		// Initialize trace fetcher for all networks (will check availability when used)
		this.traceFetcher = new TraceFetcher(this.rpcClient);

		if (this.isArbitrum) {
			this.blockFetcher = new BlockFetcherArbitrum(this.rpcClient, chainId);
			this.transactionFetcher = new TransactionFetcherArbitrum(
				this.rpcClient,
				chainId,
			);
			this.addressFetcher = new AddressFetcherArbitrum(this.rpcClient, chainId);
			this.networkStatsFetcher = new NetworkStatsFetcherArbitrum(
				this.rpcClient,
				chainId,
			);
		} else if (this.isOptimism) {
			this.blockFetcher = new BlockFetcherOptimism(this.rpcClient, chainId);
			this.transactionFetcher = new TransactionFetcherOptimism(
				this.rpcClient,
				chainId,
			);
			this.addressFetcher = new AddressFetcherOptimism(this.rpcClient, chainId);
			this.networkStatsFetcher = new NetworkStatsFetcherOptimism(
				this.rpcClient,
				chainId,
			);
		} else {
			this.blockFetcher = new BlockFetcher(this.rpcClient, chainId);
			this.transactionFetcher = new TransactionFetcher(this.rpcClient, chainId);
			this.addressFetcher = new AddressFetcher(this.rpcClient, chainId);
			this.networkStatsFetcher = new NetworkStatsFetcher(
				this.rpcClient,
				chainId,
			);
		}
	}

	private getCached<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		const isExpired = Date.now() - entry.timestamp > this.cacheTimeout;
		if (isExpired) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	private setCache<T>(key: string, data: T): void {
		this.cache.set(key, { data, timestamp: Date.now() });
	}

	private getCacheKey(prefix: string, identifier: string | number): string {
		return `${this.chainId}:${prefix}:${identifier}`;
	}

	async getBlock(blockNumber: number | "latest"): Promise<Block> {
		const cacheKey = this.getCacheKey("block", blockNumber);
		const cached = this.getCached<Block>(cacheKey);
		if (cached) return cached;

		const rpcBlock = await this.blockFetcher.getBlock(blockNumber);
		if (!rpcBlock) throw new Error("Block not found");

		const block = this.isArbitrum
			? BlockArbitrumAdapter.fromRPCBlock(rpcBlock, this.chainId)
			: this.isOptimism
				? BlockOptimismAdapter.fromRPCBlock(rpcBlock, this.chainId)
				: BlockAdapter.fromRPCBlock(rpcBlock, this.chainId);

		// Only cache non-latest blocks
		if (blockNumber !== "latest") {
			this.setCache(cacheKey, block);
		}

		return block;
	}

	async getBlockWithTransactions(
		blockNumber: number | "latest",
	): Promise<Block & { transactionDetails: Transaction[] }> {
		const rpcBlock =
			await this.blockFetcher.getBlockWithTransactions(blockNumber);
		if (!rpcBlock) throw new Error("Block not found");

		const block = this.isArbitrum
			? BlockArbitrumAdapter.fromRPCBlock(rpcBlock, this.chainId)
			: this.isOptimism
				? BlockOptimismAdapter.fromRPCBlock(rpcBlock, this.chainId)
				: BlockAdapter.fromRPCBlock(rpcBlock, this.chainId);

		// Transform transaction objects
		const transactionDetails = (
			Array.isArray(rpcBlock.transactions) ? rpcBlock.transactions : []
		)
			.filter((tx) => typeof tx !== "string")
			.map((tx) =>
				this.isArbitrum
					? TransactionArbitrumAdapter.fromRPCTransaction(
							tx as any,
							this.chainId,
						)
					: this.isOptimism
						? TransactionOptimismAdapter.fromRPCTransaction(
								tx as any,
								this.chainId,
							)
						: TransactionAdapter.fromRPCTransaction(tx as any, this.chainId),
			);

		return { ...block, transactionDetails };
	}

	async getTransaction(txHash: string): Promise<Transaction> {
		const cacheKey = this.getCacheKey("tx", txHash);
		const cached = this.getCached<Transaction>(cacheKey);
		if (cached) return cached;

		const [rpcTx, receipt] = await Promise.all([
			this.transactionFetcher.getTransaction(txHash),
			this.transactionFetcher.getTransactionReceipt(txHash),
		]);

		if (!rpcTx) throw new Error("Transaction not found");

		// Get timestamp from block if available
		let timestamp: string = "";
		if (rpcTx.blockNumber) {
			const block = await this.getBlock(parseInt(rpcTx.blockNumber, 16));
			timestamp = block.timestamp.toString();
		}

		const transaction = this.isArbitrum
			? TransactionArbitrumAdapter.fromRPCTransaction(
					rpcTx,
					this.chainId,
					receipt,
				)
			: this.isOptimism
				? TransactionOptimismAdapter.fromRPCTransaction(
						rpcTx,
						this.chainId,
						receipt,
					)
				: TransactionAdapter.fromRPCTransaction(rpcTx, this.chainId, receipt);
		// transaction.timestamp = timestamp;

		this.setCache(cacheKey, transaction);
		return transaction;
	}

	async getAddress(address: string): Promise<Address> {
		const cacheKey = this.getCacheKey("address", address);
		const cached = this.getCached<Address>(cacheKey);
		if (cached) return cached;

		const [balance, code, txCount] = await Promise.all([
			this.addressFetcher.getBalance(address),
			this.addressFetcher.getCode(address),
			this.addressFetcher.getTransactionCount(address),
		]);

		const addressData = this.isArbitrum
			? AddressAdapterArbitrum.fromRawData(
					address,
					balance,
					code,
					txCount,
					this.chainId,
				)
			: this.isOptimism
				? AddressAdapterOptimism.fromRawData(
						address,
						balance,
						code,
						txCount,
						this.chainId,
					)
				: AddressAdapter.fromRawData(
						address,
						balance,
						code,
						txCount,
						this.chainId,
					);

		// Fetch recent transactions for this address
		try {
			const latestBlockNumber = await this.getLatestBlockNumber();
			const recentTransactions: Transaction[] = [];
			const blocksToCheck = 10; // Check last 10 blocks

			for (
				let i = 0;
				i < blocksToCheck && recentTransactions.length < 10;
				i++
			) {
				const blockNum = latestBlockNumber - i;
				if (blockNum < 0) break;

				const block = await this.getBlockWithTransactions(blockNum);
				if (block.transactionDetails) {
					const addressTxs = block.transactionDetails.filter(
						(tx) =>
							tx.from?.toLowerCase() === address.toLowerCase() ||
							tx.to?.toLowerCase() === address.toLowerCase(),
					);
					recentTransactions.push(...addressTxs);
					if (recentTransactions.length >= 10) break;
				}
			}

			addressData.recentTransactions = recentTransactions.slice(0, 10);
		} catch (error) {
			console.error("Error fetching recent transactions:", error);
			addressData.recentTransactions = [];
		}

		this.setCache(cacheKey, addressData);
		return addressData;
	}

	async getLatestBlockNumber(): Promise<number> {
		return await this.blockFetcher.getLatestBlockNumber();
	}

	async getNetworkStats(): Promise<NetworkStats> {
		const cacheKey = this.getCacheKey("networkStats", "current");
		const cached = this.getCached<NetworkStats>(cacheKey);
		if (cached) return cached;

		const stats = await this.networkStatsFetcher.getNetworkStats();

		this.cache.set(cacheKey, { data: stats, timestamp: Date.now() });

		return stats;
	}

	async getLatestBlocks(count: number = 10): Promise<Block[]> {
		const latestBlockNumber = await this.getLatestBlockNumber();
		const blockNumbers = Array.from(
			{ length: count },
			(_, i) => latestBlockNumber - i,
		).filter((num) => num >= 0); // Don't go below block 0

		const blocks = await Promise.all(
			blockNumbers.map((num) => this.getBlock(num)),
		);

		return blocks;
	}

	async getTransactionsFromLatestBlocks(
		blockCount: number = 10,
	): Promise<Array<Transaction & { blockNumber: string }>> {
		const latestBlockNumber = await this.getLatestBlockNumber();
		const blockNumbers = Array.from(
			{ length: blockCount },
			(_, i) => latestBlockNumber - i,
		).filter((num) => num >= 0);

		// Fetch blocks with full transaction details
		const blocksWithTxs = await Promise.all(
			blockNumbers.map((num) => this.getBlockWithTransactions(num)),
		);

		// Flatten all transactions from all blocks, maintaining block order
		const transactions: Array<Transaction & { blockNumber: string }> = [];
		for (const block of blocksWithTxs) {
			if (block.transactionDetails && block.transactionDetails.length > 0) {
				for (const tx of block.transactionDetails) {
					transactions.push({
						...tx,
						blockNumber: block.number,
					});
				}
			}
		}

		return transactions;
	}

	getChainId(): number {
		return this.chainId;
	}

	clearCache(): void {
		this.cache.clear();
	}

	clearCacheForChain(chainId: number): void {
		const keysToDelete: string[] = [];
		this.cache.forEach((_, key) => {
			if (key.startsWith(`${chainId}:`)) {
				keysToDelete.push(key);
			}
		});
		keysToDelete.forEach((key) => this.cache.delete(key));
	}

	// Trace methods (available for localhost networks)
	isTraceAvailable(): boolean {
		return this.isLocalhost;
	}

	async getTransactionTrace(txHash: string): Promise<TraceResult | null> {
		if (!this.isLocalhost) {
			console.warn("Trace methods are only available on localhost networks");
			return null;
		}
		return await this.traceFetcher.getOpcodeTrace(txHash);
	}

	async getCallTrace(txHash: string): Promise<any> {
		if (!this.isLocalhost) {
			console.warn("Trace methods are only available on localhost networks");
			return null;
		}
		return await this.traceFetcher.getCallTrace(txHash);
	}

	async getBlockTrace(blockHash: string): Promise<TraceResult[] | null> {
		if (!this.isLocalhost) {
			console.warn("Trace methods are only available on localhost networks");
			return null;
		}
		try {
			return await this.traceFetcher.traceBlockByHash(blockHash);
		} catch (error) {
			console.error("Error getting block trace:", error);
			return null;
		}
	}
}
