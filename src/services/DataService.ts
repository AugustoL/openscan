// src/services/DataService.ts
import { RPCClient } from './EVM/common/RPCClient';
import { getRPCUrls } from '../config/rpcConfig';
import { BlockFetcher } from './EVM/L1/fetchers/mainnet/block';
import { TransactionFetcher } from './EVM/L1/fetchers/mainnet/transaction';
import { AddressFetcher } from './EVM/L1/fetchers/mainnet/address';
import { BlockAdapter } from './EVM/L1/adapters/block';
import { TransactionAdapter } from './EVM/L1/adapters/transaction';
import { AddressAdapter } from './EVM/L1/adapters/address';
import type { Block, Transaction, Address } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class DataService {
  private rpcClient: RPCClient;
  private blockFetcher: BlockFetcher;
  private transactionFetcher: TransactionFetcher;
  private addressFetcher: AddressFetcher;
  
  // Simple in-memory cache with chainId in key
  private cache = new Map<string, CacheEntry<any>>();
  private cacheTimeout = 30000; // 30 seconds

  constructor(private chainId: number) {
    console.log('DataService constructor called with chainId:', chainId);
    const rpcUrls = getRPCUrls(chainId);
    console.log('RPC URLs for chain', chainId, ':', rpcUrls);
    this.rpcClient = new RPCClient(rpcUrls);
    this.blockFetcher = new BlockFetcher(this.rpcClient, chainId);
    this.transactionFetcher = new TransactionFetcher(this.rpcClient, chainId);
    this.addressFetcher = new AddressFetcher(this.rpcClient, chainId);
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

  async getBlock(blockNumber: number | 'latest'): Promise<Block> {
    const cacheKey = this.getCacheKey('block', blockNumber);
    const cached = this.getCached<Block>(cacheKey);
    if (cached) return cached;

    const rpcBlock = await this.blockFetcher.getBlock(blockNumber);
    if (!rpcBlock) throw new Error('Block not found');

    const block = BlockAdapter.fromRPCBlock(rpcBlock, this.chainId);
    
    // Only cache non-latest blocks
    if (blockNumber !== 'latest') {
      this.setCache(cacheKey, block);
    }
    
    return block;
  }

  async getBlockWithTransactions(blockNumber: number | 'latest'): Promise<Block & { transactionDetails: Transaction[] }> {
    const rpcBlock = await this.blockFetcher.getBlockWithTransactions(blockNumber);
    if (!rpcBlock) throw new Error('Block not found');

    const block = BlockAdapter.fromRPCBlock(rpcBlock, this.chainId);
    
    // Transform transaction objects
    const transactionDetails = (Array.isArray(rpcBlock.transactions) ? rpcBlock.transactions : [])
      .filter(tx => typeof tx !== 'string')
      .map(tx => TransactionAdapter.fromRPCTransaction(tx as any, this.chainId));

    return { ...block, transactionDetails };
  }

  async getTransaction(txHash: string): Promise<Transaction> {
    const cacheKey = this.getCacheKey('tx', txHash);
    const cached = this.getCached<Transaction>(cacheKey);
    if (cached) return cached;

    const [rpcTx, receipt] = await Promise.all([
      this.transactionFetcher.getTransaction(txHash),
      this.transactionFetcher.getTransactionReceipt(txHash),
    ]);

    if (!rpcTx) throw new Error('Transaction not found');

    // Get timestamp from block if available
    let timestamp: string = '';
    if (rpcTx.blockNumber) {
      const block = await this.getBlock(parseInt(rpcTx.blockNumber, 16));
      timestamp = block.timestamp.toString();
    }

    const transaction = TransactionAdapter.fromRPCTransaction(rpcTx, this.chainId, receipt);
    // transaction.timestamp = timestamp;

    this.setCache(cacheKey, transaction);
    return transaction;
  }

  async getAddress(address: string): Promise<Address> {
    const cacheKey = this.getCacheKey('address', address);
    const cached = this.getCached<Address>(cacheKey);
    if (cached) return cached;

    const [balance, code, txCount] = await Promise.all([
      this.addressFetcher.getBalance(address),
      this.addressFetcher.getCode(address),
      this.addressFetcher.getTransactionCount(address),
    ]);

    const addressData = AddressAdapter.fromRawData(address, balance, code, txCount, this.chainId);
    
    this.setCache(cacheKey, addressData);
    return addressData;
  }

  async getLatestBlockNumber(): Promise<number> {
    return await this.blockFetcher.getLatestBlockNumber();
  }

  async getLatestBlocks(count: number = 10): Promise<Block[]> {
    const latestBlockNumber = await this.getLatestBlockNumber();
    const blockNumbers = Array.from(
      { length: count },
      (_, i) => latestBlockNumber - i
    ).filter(num => num >= 0); // Don't go below block 0

    const blocks = await Promise.all(
      blockNumbers.map(num => this.getBlock(num))
    );

    return blocks;
  }

  async getTransactionsFromLatestBlocks(blockCount: number = 10): Promise<Array<Transaction & { blockNumber: string }>> {
    const latestBlockNumber = await this.getLatestBlockNumber();
    const blockNumbers = Array.from(
      { length: blockCount },
      (_, i) => latestBlockNumber - i
    ).filter(num => num >= 0);

    // Fetch blocks with full transaction details
    const blocksWithTxs = await Promise.all(
      blockNumbers.map(num => this.getBlockWithTransactions(num))
    );

    // Flatten all transactions from all blocks, maintaining block order
    const transactions: Array<Transaction & { blockNumber: string }> = [];
    for (const block of blocksWithTxs) {
      if (block.transactionDetails && block.transactionDetails.length > 0) {
        for (const tx of block.transactionDetails) {
          transactions.push({
            ...tx,
            blockNumber: block.number
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
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}