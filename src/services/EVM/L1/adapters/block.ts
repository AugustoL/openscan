// src/services/EVM/L1/adapters/block.ts
import type { Block, RPCBlock } from "../../../../types";

// biome-ignore lint/complexity/noStaticOnlyClass: <TODO>
export class BlockAdapter {
  static fromRPCBlock(rpcBlock: RPCBlock, _chainId: number): Block {
    console.log(rpcBlock);
    const timestamp = rpcBlock.timestamp
      ? parseInt(rpcBlock.timestamp, rpcBlock.timestamp.startsWith("0x") ? 16 : 10).toString()
      : "0";
    return {
      number: rpcBlock.number,
      hash: rpcBlock.hash,
      parentHash: rpcBlock.parentHash,
      timestamp,
      baseFeePerGas: rpcBlock.baseFeePerGas ? BigInt(rpcBlock.baseFeePerGas).toString() : undefined,
      nonce: rpcBlock.nonce,
      difficulty: BigInt(rpcBlock.difficulty).toString(),
      gasLimit: BigInt(rpcBlock.gasLimit).toString(),
      gasUsed: BigInt(rpcBlock.gasUsed).toString(),
      miner: rpcBlock.miner,
      extraData: rpcBlock.extraData,
      transactions: Array.isArray(rpcBlock.transactions)
        ? rpcBlock.transactions.map((tx) => (typeof tx === "string" ? tx : tx.hash))
        : [],
      size: rpcBlock.size,
      logsBloom: rpcBlock.logsBloom,
      stateRoot: rpcBlock.stateRoot,
      receiptsRoot: rpcBlock.receiptsRoot,
      transactionsRoot: rpcBlock.transactionsRoot,
      uncles: rpcBlock.uncles,
      mixHash: rpcBlock.mixHash,
      sha3Uncles: rpcBlock.sha3Uncles,
      totalDifficulty: BigInt(rpcBlock.difficulty).toString(),
      blobGasUsed: rpcBlock.blobGasUsed,
      excessBlobGas: rpcBlock.excessBlobGas,
      withdrawalsRoot: rpcBlock.withdrawalsRoot,
      withdrawals: rpcBlock.withdrawals,
    };
  }
}
