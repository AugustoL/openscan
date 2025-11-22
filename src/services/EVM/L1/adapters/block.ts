// src/services/EVM/L1/adapters/block.ts
import type { RPCBlock } from '../../../../types';
import type { Block } from '../../../../types';

export class BlockAdapter {
  static fromRPCBlock(rpcBlock: RPCBlock, chainId: number): Block {
    return {
      number: rpcBlock.number,
      hash: rpcBlock.hash,
      parentHash: rpcBlock.parentHash,
      timestamp: rpcBlock.timestamp,
      nonce: rpcBlock.nonce,
      difficulty: BigInt(rpcBlock.difficulty).toString(),
      gasLimit: BigInt(rpcBlock.gasLimit).toString(),
      gasUsed: BigInt(rpcBlock.gasUsed).toString(),
      miner: rpcBlock.miner,
      extraData: rpcBlock.extraData,
      transactions: Array.isArray(rpcBlock.transactions)
        ? rpcBlock.transactions.map(tx => typeof tx === 'string' ? tx : tx.hash)
        : [],
      size: rpcBlock.size,
      logsBloom: rpcBlock.logsBloom,
      stateRoot: rpcBlock.stateRoot,
      receiptsRoot: rpcBlock.receiptsRoot,
      transactionsRoot: rpcBlock.transactionsRoot,
      uncles: rpcBlock.uncles,
      mixHash: "",
      sha3Uncles: rpcBlock.sha3Uncles,
      totalDifficulty: "",
    };
  }
}
