// src/services/EVM/L1/adapters/transaction.ts
import type { RPCTransaction, RPCTransactionReceipt, Transaction } from "../../../../types";

// biome-ignore lint/complexity/noStaticOnlyClass: <TODO>
export class TransactionAdapter {
  static fromRPCTransaction(
    rpcTx: RPCTransaction,
    _chainId: number,
    receipt?: RPCTransactionReceipt | null,
  ): Transaction {
    const transaction: Transaction = {
      hash: rpcTx.hash,
      from: rpcTx.from,
      to: rpcTx.to,
      value: BigInt(rpcTx.value).toString(),
      gas: BigInt(rpcTx.gas).toString(),
      gasPrice: rpcTx.gasPrice ? BigInt(rpcTx.gasPrice).toString() : "0",
      maxFeePerGas: rpcTx.maxFeePerGas ? BigInt(rpcTx.maxFeePerGas).toString() : undefined,
      maxPriorityFeePerGas: rpcTx.maxPriorityFeePerGas
        ? BigInt(rpcTx.maxPriorityFeePerGas).toString()
        : undefined,
      nonce: parseInt(rpcTx.nonce, 16).toString(),
      data: rpcTx.input,
      blockNumber: parseInt(rpcTx.blockNumber, 16).toString(),
      blockHash: rpcTx.blockHash,
      transactionIndex: parseInt(rpcTx.transactionIndex, 16).toString(),
      v: rpcTx.v,
      r: rpcTx.r,
      s: rpcTx.s,
      type: rpcTx.type,
    };

    if (receipt) {
      transaction.receipt = {
        blockHash: receipt.blockHash,
        blockNumber: parseInt(receipt.blockNumber, 16).toString(),
        contractAddress: receipt.contractAddress,
        cumulativeGasUsed: BigInt(receipt.cumulativeGasUsed).toString(),
        effectiveGasPrice: BigInt(receipt.effectiveGasPrice).toString(),
        from: receipt.from,
        gasUsed: BigInt(receipt.gasUsed).toString(),
        logs: receipt.logs,
        logsBloom: receipt.logsBloom,
        status: receipt.status,
        to: receipt.to,
        transactionHash: receipt.transactionHash,
        transactionIndex: parseInt(receipt.transactionIndex, 16).toString(),
        type: receipt.type,
      };
    }

    return transaction;
  }
}
