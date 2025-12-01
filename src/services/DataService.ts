// src/services/DataService.ts

import { getRPCUrls } from "../config/rpcConfig";
import type {
  Address,
  AddressTransactionsResult,
  Block,
  DataWithMetadata,
  NetworkStats,
  RPCMetadata,
  RPCStrategy,
  RpcUrlsContextType,
  Transaction,
} from "../types";
import { AddressAdapter as AddressAdapterArbitrum } from "./EVM/Arbitrum/adapters/address";
import { BlockArbitrumAdapter } from "./EVM/Arbitrum/adapters/block";
import { TransactionArbitrumAdapter } from "./EVM/Arbitrum/adapters/transaction";
import { AddressFetcher as AddressFetcherArbitrum } from "./EVM/Arbitrum/fetchers/address";
// Arbitrum imports
import { BlockFetcher as BlockFetcherArbitrum } from "./EVM/Arbitrum/fetchers/block";
import { NetworkStatsFetcher as NetworkStatsFetcherArbitrum } from "./EVM/Arbitrum/fetchers/networkStats";
import { TransactionFetcher as TransactionFetcherArbitrum } from "./EVM/Arbitrum/fetchers/transaction";
import { RPCClient } from "./EVM/common/RPCClient";
import { AddressAdapter } from "./EVM/L1/adapters/address";
import { BlockAdapter } from "./EVM/L1/adapters/block";
import { TransactionAdapter } from "./EVM/L1/adapters/transaction";
import { AddressFetcher } from "./EVM/L1/fetchers/address";
import { BlockFetcher } from "./EVM/L1/fetchers/block";
import { NetworkStatsFetcher } from "./EVM/L1/fetchers/networkStats";
import { TraceFetcher, type TraceResult } from "./EVM/L1/fetchers/trace";
import { TransactionFetcher } from "./EVM/L1/fetchers/transaction";
import { AddressAdapter as AddressAdapterOptimism } from "./EVM/Optimism/adapters/address";
import { BlockOptimismAdapter } from "./EVM/Optimism/adapters/block";
import { TransactionOptimismAdapter } from "./EVM/Optimism/adapters/transaction";
import { AddressFetcher as AddressFetcherOptimism } from "./EVM/Optimism/fetchers/address";
// Optimism imports
import { BlockFetcher as BlockFetcherOptimism } from "./EVM/Optimism/fetchers/block";
import { NetworkStatsFetcher as NetworkStatsFetcherOptimism } from "./EVM/Optimism/fetchers/networkStats";
import { TransactionFetcher as TransactionFetcherOptimism } from "./EVM/Optimism/fetchers/transaction";
import { RPCMetadataService } from "./RPCMetadataService";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class DataService {
  private rpcClient: RPCClient;
  private blockFetcher: BlockFetcher | BlockFetcherArbitrum | BlockFetcherOptimism;
  private transactionFetcher:
    | TransactionFetcher
    | TransactionFetcherArbitrum
    | TransactionFetcherOptimism;
  private addressFetcher: AddressFetcher | AddressFetcherArbitrum | AddressFetcherOptimism;
  private networkStatsFetcher:
    | NetworkStatsFetcher
    | NetworkStatsFetcherArbitrum
    | NetworkStatsFetcherOptimism;
  private traceFetcher: TraceFetcher;
  private isArbitrum: boolean;
  private isOptimism: boolean;
  private isLocalhost: boolean;

  // Simple in-memory cache with chainId in key
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  private cache = new Map<string, CacheEntry<any>>();
  private cacheTimeout = 30000; // 30 seconds

  constructor(
    private chainId: number,
    rpcUrlsMap: RpcUrlsContextType,
    strategy?: RPCStrategy,
  ) {
    console.log("DataService constructor called with chainId:", chainId, "strategy:", strategy);
    const rpcUrls = getRPCUrls(chainId, rpcUrlsMap);
    console.log("RPC URLs for chain", chainId, ":", rpcUrls);
    this.rpcClient = new RPCClient({
      rpcUrls,
      strategy: strategy || "fallback",
    });

    // Check which network we're on
    this.isArbitrum = chainId === 42161;
    // OP Stack chains: Optimism (10), Base (8453)
    this.isOptimism = chainId === 10 || chainId === 8453;
    this.isLocalhost = chainId === 31337;

    // Initialize trace fetcher for all networks (will check availability when used)
    this.traceFetcher = new TraceFetcher(this.rpcClient);

    if (this.isArbitrum) {
      this.blockFetcher = new BlockFetcherArbitrum(this.rpcClient, chainId);
      this.transactionFetcher = new TransactionFetcherArbitrum(this.rpcClient, chainId);
      this.addressFetcher = new AddressFetcherArbitrum(this.rpcClient, chainId);
      this.networkStatsFetcher = new NetworkStatsFetcherArbitrum(this.rpcClient, chainId);
    } else if (this.isOptimism) {
      this.blockFetcher = new BlockFetcherOptimism(this.rpcClient, chainId);
      this.transactionFetcher = new TransactionFetcherOptimism(this.rpcClient, chainId);
      this.addressFetcher = new AddressFetcherOptimism(this.rpcClient, chainId);
      this.networkStatsFetcher = new NetworkStatsFetcherOptimism(this.rpcClient, chainId);
    } else {
      this.blockFetcher = new BlockFetcher(this.rpcClient, chainId);
      this.transactionFetcher = new TransactionFetcher(this.rpcClient, chainId);
      this.addressFetcher = new AddressFetcher(this.rpcClient, chainId);
      this.networkStatsFetcher = new NetworkStatsFetcher(this.rpcClient, chainId);
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

  async getBlock(blockNumber: number | "latest"): Promise<DataWithMetadata<Block>> {
    const cacheKey = this.getCacheKey("block", blockNumber);
    const cached = this.getCached<Block>(cacheKey);
    if (cached) return { data: cached };

    // Check if parallel strategy is enabled
    if (this.rpcClient.getStrategy() === "parallel") {
      // Use parallel call to get all responses
      const results = await this.rpcClient.parallelCall("eth_getBlockByNumber", [
        typeof blockNumber === "number" ? `0x${blockNumber.toString(16)}` : blockNumber,
        true,
      ]);

      // Build complete block objects for each provider
      const enrichedResults = results.map((result) => {
        if (result.status === "fulfilled" && result.response) {
          const block = this.isArbitrum
            ? BlockArbitrumAdapter.fromRPCBlock(result.response, this.chainId)
            : this.isOptimism
              ? BlockOptimismAdapter.fromRPCBlock(result.response, this.chainId)
              : BlockAdapter.fromRPCBlock(result.response, this.chainId);

          return {
            ...result,
            response: block,
          };
        }
        return result;
      });

      // Create metadata with enriched block objects
      const metadata = RPCMetadataService.createMetadata(enrichedResults, "parallel");

      // Get the default block (first successful)
      const defaultBlock = enrichedResults.find(
        (r) => r.status === "fulfilled" && r.response,
      )?.response;

      if (!defaultBlock) {
        throw new Error("All RPC endpoints failed");
      }

      // Only cache non-latest blocks
      if (blockNumber !== "latest") {
        this.setCache(cacheKey, defaultBlock);
      }

      return { data: defaultBlock, metadata };
    } else {
      // Fallback strategy - use existing logic
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

      return { data: block };
    }
  }

  async getBlockWithTransactions(
    blockNumber: number | "latest",
  ): Promise<Block & { transactionDetails: Transaction[] }> {
    const rpcBlock = await this.blockFetcher.getBlockWithTransactions(blockNumber);
    if (!rpcBlock) throw new Error("Block not found");

    const block = this.isArbitrum
      ? BlockArbitrumAdapter.fromRPCBlock(rpcBlock, this.chainId)
      : this.isOptimism
        ? BlockOptimismAdapter.fromRPCBlock(rpcBlock, this.chainId)
        : BlockAdapter.fromRPCBlock(rpcBlock, this.chainId);

    // Transform transaction objects
    const transactionDetails = (Array.isArray(rpcBlock.transactions) ? rpcBlock.transactions : [])
      .filter((tx) => typeof tx !== "string")
      .map((tx) =>
        this.isArbitrum
          ? // biome-ignore lint/suspicious/noExplicitAny: <TODO>
            TransactionArbitrumAdapter.fromRPCTransaction(tx as any, this.chainId)
          : this.isOptimism
            ? // biome-ignore lint/suspicious/noExplicitAny: <TODO>
              TransactionOptimismAdapter.fromRPCTransaction(tx as any, this.chainId)
            : // biome-ignore lint/suspicious/noExplicitAny: <TODO>
              TransactionAdapter.fromRPCTransaction(tx as any, this.chainId),
      );

    return { ...block, transactionDetails };
  }

  async getTransaction(txHash: string): Promise<DataWithMetadata<Transaction>> {
    const cacheKey = this.getCacheKey("tx", txHash);
    const cached = this.getCached<Transaction>(cacheKey);
    if (cached) return { data: cached };

    // Check if parallel strategy is enabled
    if (this.rpcClient.getStrategy() === "parallel") {
      // Use parallel call for transaction
      const results = await this.rpcClient.parallelCall("eth_getTransactionByHash", [txHash]);

      // Find first successful response
      const successfulResult = results.find((r) => r.status === "fulfilled");
      if (!successfulResult || !successfulResult.response) {
        throw new Error("All RPC endpoints failed");
      }

      const rpcTx = successfulResult.response;

      // Get receipt (use same strategy)
      const receiptResults = await this.rpcClient.parallelCall("eth_getTransactionReceipt", [
        txHash,
      ]);

      // Get timestamp from block if available
      let timestamp: string = "";
      let baseFeePerGas: string | undefined;
      if (rpcTx.blockNumber) {
        const blockResult = await this.getBlock(parseInt(rpcTx.blockNumber, 16));
        const block = blockResult.data;
        timestamp = block.timestamp.toString();
        baseFeePerGas = block.baseFeePerGas;
      }

      // Build complete transaction objects for each provider
      // This includes receipts so that when users switch providers, they see complete data
      const enrichedResults = results.map((txResult) => {
        if (txResult.status === "fulfilled" && txResult.response) {
          // Find matching receipt for this provider
          const matchingReceipt = receiptResults.find(
            (r) => r.url === txResult.url && r.status === "fulfilled",
          );
          const receipt = matchingReceipt?.response;

          // Create adapted transaction with receipt
          const transaction = this.isArbitrum
            ? TransactionArbitrumAdapter.fromRPCTransaction(
                txResult.response,
                this.chainId,
                receipt,
              )
            : this.isOptimism
              ? TransactionOptimismAdapter.fromRPCTransaction(
                  txResult.response,
                  this.chainId,
                  receipt,
                )
              : TransactionAdapter.fromRPCTransaction(txResult.response, this.chainId, receipt);

          // Add timestamp and base fee
          if (timestamp) {
            transaction.timestamp = timestamp;
          }
          if (baseFeePerGas) {
            transaction.blockBaseFeePerGas = baseFeePerGas;
          }

          return {
            ...txResult,
            response: transaction,
          };
        }
        return txResult;
      });

      // Create metadata with enriched transaction objects (including receipts)
      const metadata = RPCMetadataService.createMetadata(enrichedResults, "parallel");

      // Get the default transaction (first successful)
      const defaultTransaction = enrichedResults.find(
        (r) => r.status === "fulfilled" && r.response,
      )?.response;

      if (!defaultTransaction) {
        throw new Error("Failed to create transaction object");
      }

      this.setCache(cacheKey, defaultTransaction);
      return { data: defaultTransaction, metadata };
    } else {
      // Fallback strategy
      const [rpcTx, receipt] = await Promise.all([
        this.transactionFetcher.getTransaction(txHash),
        this.transactionFetcher.getTransactionReceipt(txHash),
      ]);

      if (!rpcTx) throw new Error("Transaction not found");

      // Get timestamp from block if available
      let timestamp: string = "";
      let baseFeePerGas: string | undefined;
      if (rpcTx.blockNumber) {
        const blockResult = await this.getBlock(parseInt(rpcTx.blockNumber, 16));
        const block = blockResult.data;
        timestamp = block.timestamp.toString();
        baseFeePerGas = block.baseFeePerGas;
      }

      const transaction = this.isArbitrum
        ? TransactionArbitrumAdapter.fromRPCTransaction(rpcTx, this.chainId, receipt)
        : this.isOptimism
          ? TransactionOptimismAdapter.fromRPCTransaction(rpcTx, this.chainId, receipt)
          : TransactionAdapter.fromRPCTransaction(rpcTx, this.chainId, receipt);

      if (timestamp) {
        transaction.timestamp = timestamp;
      }
      if (baseFeePerGas) {
        transaction.blockBaseFeePerGas = baseFeePerGas;
      }

      this.setCache(cacheKey, transaction);
      return { data: transaction };
    }
  }

  async getAddress(address: string): Promise<DataWithMetadata<Address>> {
    const cacheKey = this.getCacheKey("address", address);
    const cached = this.getCached<Address>(cacheKey);
    if (cached) return { data: cached };

    let metadata: RPCMetadata | undefined;
    let addressData: Address;

    if (this.rpcClient.getStrategy() === "parallel") {
      // Parallel strategy: query all providers simultaneously
      const [balanceResults, codeResults, txCountResults] = await Promise.all([
        this.rpcClient.parallelCall<string>("eth_getBalance", [address.toLowerCase(), "latest"]),
        this.rpcClient.parallelCall<string>("eth_getCode", [address.toLowerCase(), "latest"]),
        this.rpcClient.parallelCall<string>("eth_getTransactionCount", [
          address.toLowerCase(),
          "latest",
        ]),
      ]);

      // Build complete address objects for each provider
      const enrichedResults = balanceResults.map((balanceResult, index) => {
        if (balanceResult.status === "fulfilled" && balanceResult.response) {
          const codeResult = codeResults[index];
          const txCountResult = txCountResults[index];

          // Check if all data is available for this provider
          if (
            codeResult?.status === "fulfilled" &&
            codeResult.response &&
            txCountResult?.status === "fulfilled" &&
            txCountResult.response
          ) {
            const balance = BigInt(balanceResult.response);
            const code = codeResult.response;
            const txCount = Number.parseInt(txCountResult.response, 16);

            const addressData = this.isArbitrum
              ? AddressAdapterArbitrum.fromRawData(address, balance, code, txCount, this.chainId)
              : this.isOptimism
                ? AddressAdapterOptimism.fromRawData(address, balance, code, txCount, this.chainId)
                : AddressAdapter.fromRawData(address, balance, code, txCount, this.chainId);

            return {
              ...balanceResult,
              response: addressData,
            };
          }
        }
        return balanceResult;
      });

      // Create metadata with enriched address objects
      metadata = RPCMetadataService.createMetadata(enrichedResults, "parallel");

      // Get the default address (first successful)
      const defaultAddressResult = enrichedResults.find(
        (r) => r.status === "fulfilled" && r.response,
      );

      if (!defaultAddressResult || typeof defaultAddressResult.response === "string") {
        throw new Error("Failed to fetch address data from all providers");
      }

      addressData = defaultAddressResult.response as Address;
    } else {
      // Fallback strategy: use sequential fetching
      const [balance, code, txCount] = await Promise.all([
        this.addressFetcher.getBalance(address),
        this.addressFetcher.getCode(address),
        this.addressFetcher.getTransactionCount(address),
      ]);

      addressData = this.isArbitrum
        ? AddressAdapterArbitrum.fromRawData(address, balance, code, txCount, this.chainId)
        : this.isOptimism
          ? AddressAdapterOptimism.fromRawData(address, balance, code, txCount, this.chainId)
          : AddressAdapter.fromRawData(address, balance, code, txCount, this.chainId);
    }

    // Fetch recent transactions for this address
    try {
      const latestBlockNumber = await this.getLatestBlockNumber();
      const recentTransactions: Transaction[] = [];
      const blocksToCheck = 10; // Check last 10 blocks

      for (let i = 0; i < blocksToCheck && recentTransactions.length < 10; i++) {
        const blockNum = latestBlockNumber - i;
        if (blockNum < 0) break;

        const block = await this.getBlockWithTransactions(blockNum);
        if (block.transactionDetails) {
          const addressTxs = block.transactionDetails.filter(
            (tx: Transaction) =>
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
    return { data: addressData, metadata };
  }

  /**
   * Get all transactions for an address using trace_filter or eth_getLogs fallback
   * @param address The address to get transactions for
   * @param fromBlock Starting block (default: last 10000 blocks)
   * @param toBlock Ending block (default: latest)
   * @param limit Maximum number of transactions to return
   */
  async getAddressTransactions(
    address: string,
    fromBlock?: number | "earliest",
    toBlock?: number | "latest",
    limit: number = 100,
  ): Promise<AddressTransactionsResult> {
    // If no fromBlock specified, use last 10000 blocks to avoid huge queries
    let actualFromBlock = fromBlock;
    if (!actualFromBlock) {
      const latestBlock = await this.getLatestBlockNumber();
      actualFromBlock = Math.max(0, latestBlock - 10000);
    }

    const result = await this.addressFetcher.getAddressTransactions(
      address,
      actualFromBlock,
      toBlock || "latest",
    );

    // Limit the results
    if (result.transactions.length > limit) {
      result.transactions = result.transactions.slice(0, limit);
    }

    return result;
  }

  async getLatestBlockNumber(): Promise<number> {
    return await this.blockFetcher.getLatestBlockNumber();
  }

  async getNetworkStats(): Promise<DataWithMetadata<NetworkStats>> {
    const cacheKey = this.getCacheKey("networkStats", "current");
    const cached = this.getCached<NetworkStats>(cacheKey);
    if (cached) return { data: cached };

    let metadata: RPCMetadata | undefined;

    if (this.rpcClient.getStrategy() === "parallel") {
      // Parallel strategy: query all providers simultaneously
      const [gasPriceResults, syncingResults, blockNumberResults, clientVersionResults] =
        await Promise.all([
          this.rpcClient.parallelCall<string>("eth_gasPrice", []),
          this.rpcClient.parallelCall<boolean | object>("eth_syncing", []),
          this.rpcClient.parallelCall<string>("eth_blockNumber", []),
          this.rpcClient.parallelCall<string>("web3_clientVersion", []),
        ]);

      // Hardhat metadata (only for localhost)
      let metadataResults: Array<{
        url: string;
        status: "fulfilled" | "rejected";
        response?: string;
        error?: Error;
      }> = [];

      if (this.chainId === 31337) {
        metadataResults = await this.rpcClient.parallelCall<string>("hardhat_metadata", []);
      }

      // Build complete NetworkStats objects for EACH provider
      const enrichedResults = gasPriceResults.map((gasPriceResult, index) => {
        if (gasPriceResult.status === "fulfilled" && gasPriceResult.response) {
          const syncingResult = syncingResults[index];
          const blockNumberResult = blockNumberResults[index];
          const clientVersionResult = clientVersionResults[index];

          // Verify all calls from same provider succeeded
          if (
            syncingResult?.status === "fulfilled" &&
            blockNumberResult?.status === "fulfilled" &&
            blockNumberResult.response
          ) {
            // Get hardhat metadata for this provider (localhost only)
            const hardhatMetadata =
              this.chainId === 31337
                ? metadataResults[index]?.status === "fulfilled"
                  ? metadataResults[index].response || ""
                  : ""
                : "";

            // Build complete NetworkStats object for this provider
            const networkStats: NetworkStats = {
              currentGasPrice: gasPriceResult.response,
              isSyncing: typeof syncingResult.response === "object",
              currentBlockNumber: blockNumberResult.response,
              clientVersion: clientVersionResult?.response || "Unknown",
              metadata: hardhatMetadata,
            };

            return {
              ...gasPriceResult,
              response: networkStats, // Now contains complete domain object
            };
          }
        }
        // If any call failed for this provider, preserve the error
        return gasPriceResult;
      });

      // Create metadata with enriched NetworkStats objects
      metadata = RPCMetadataService.createMetadata(enrichedResults, "parallel");

      // Extract default stats (first successful provider)
      const defaultStats = enrichedResults.find((r) => r.status === "fulfilled" && r.response)
        ?.response as NetworkStats | undefined;

      if (!defaultStats) {
        throw new Error("Failed to fetch network stats from all providers");
      }

      this.cache.set(cacheKey, { data: defaultStats, timestamp: Date.now() });
      return { data: defaultStats, metadata };
    } else {
      // Fallback strategy: use sequential fetching
      const stats = await this.networkStatsFetcher.getNetworkStats();
      this.cache.set(cacheKey, { data: stats, timestamp: Date.now() });
      return { data: stats };
    }
  }

  async getLatestBlocks(count: number = 10): Promise<Block[]> {
    const latestBlockNumber = await this.getLatestBlockNumber();
    const blockNumbers = Array.from({ length: count }, (_, i) => latestBlockNumber - i).filter(
      (num) => num >= 0,
    ); // Don't go below block 0

    const blockResults = await Promise.all(blockNumbers.map((num) => this.getBlock(num)));

    return blockResults.map((result) => result.data);
  }

  async getTransactionsFromLatestBlocks(
    blockCount: number = 10,
  ): Promise<Array<Transaction & { blockNumber: string }>> {
    const latestBlockNumber = await this.getLatestBlockNumber();
    const blockNumbers = Array.from({ length: blockCount }, (_, i) => latestBlockNumber - i).filter(
      (num) => num >= 0,
    );

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

  async getTransactionsFromBlockRange(
    fromBlock: number,
    blockCount: number = 10,
  ): Promise<Array<Transaction & { blockNumber: string }>> {
    // Calculate block numbers to fetch (going backwards from fromBlock)
    const blockNumbers = Array.from({ length: blockCount }, (_, i) => fromBlock - i).filter(
      (num) => num >= 0,
    );

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
    keysToDelete.forEach((key) => {
      this.cache.delete(key);
    });
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

  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
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
