// src/services/EVM/Arbitrum/adapters/block.ts
import type { BlockArbitrum } from "../../../../types";

// biome-ignore lint/complexity/noStaticOnlyClass: <TODO>
export class BlockArbitrumAdapter {
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  static fromRPCBlock(rpcBlock: any, _chainId: number): BlockArbitrum {
    console.log("Arbitrum block:", rpcBlock);
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
      difficulty: BigInt(rpcBlock.difficulty || 0).toString(),
      gasLimit: BigInt(rpcBlock.gasLimit).toString(),
      gasUsed: BigInt(rpcBlock.gasUsed).toString(),
      miner: rpcBlock.miner,
      extraData: rpcBlock.extraData,
      transactions: Array.isArray(rpcBlock.transactions)
        ? // biome-ignore lint/suspicious/noExplicitAny: <TODO>
          rpcBlock.transactions.map((tx: any) => (typeof tx === "string" ? tx : tx.hash))
        : [],
      size: rpcBlock.size,
      logsBloom: rpcBlock.logsBloom,
      stateRoot: rpcBlock.stateRoot,
      receiptsRoot: rpcBlock.receiptsRoot,
      transactionsRoot: rpcBlock.transactionsRoot,
      uncles: rpcBlock.uncles || [],
      mixHash: rpcBlock.mixHash,
      sha3Uncles: rpcBlock.sha3Uncles,
      totalDifficulty: BigInt(rpcBlock.difficulty || 0).toString(),
      blobGasUsed: rpcBlock.blobGasUsed,
      excessBlobGas: rpcBlock.excessBlobGas,
      withdrawalsRoot: rpcBlock.withdrawalsRoot,
      withdrawals: rpcBlock.withdrawals || [],
      // Arbitrum-specific fields
      l1BlockNumber: rpcBlock.l1BlockNumber || "0",
      sendCount: rpcBlock.sendCount || "0",
      sendRoot:
        rpcBlock.sendRoot || "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
  }
}
