// src/services/EVM/L1/fetchers/mainnet/block.ts
import { RPCClient } from '../../../common/RPCClient';
import type { RPCBlock } from '../../../../../types';

export class BlockFetcher {
  constructor(private rpcClient: RPCClient, private chainId: number) {}

  async getBlock(blockNumber: number | 'latest'): Promise<RPCBlock | null> {
    console.log('Fetching block number:', blockNumber);
    const blockParam = blockNumber === 'latest' ? 'latest' : `0x${blockNumber.toString(16)}`;
    
    return await this.rpcClient.call<RPCBlock>('eth_getBlockByNumber', [
      blockParam,
      false, // don't include full transaction objects
    ]);
  }

  async getBlockWithTransactions(blockNumber: number | 'latest'): Promise<RPCBlock | null> {
    const blockParam = blockNumber === 'latest' ? 'latest' : `0x${blockNumber.toString(16)}`;
    
    return await this.rpcClient.call<RPCBlock>('eth_getBlockByNumber', [
      blockParam,
      true, // include full transaction objects
    ]);
  }

  async getLatestBlockNumber(): Promise<number> {
    const result = await this.rpcClient.call<string>('eth_blockNumber', []);
    return parseInt(result, 16);
  }

  async getBlockByHash(blockHash: string, fullTransactions: boolean = false): Promise<RPCBlock | null> {
    return await this.rpcClient.call<RPCBlock>('eth_getBlockByHash', [
      blockHash,
      fullTransactions,
    ]);
  }

  getChainId(): number {
    return this.chainId;
  }
}
