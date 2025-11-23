// src/services/EVM/Optimism/adapters/transaction.ts
import type { RPCTransaction, RPCTransactionReceipt } from "../../../../types";
import type {
	Transaction,
	TransactionReceiptOptimism,
} from "../../../../types";

export class TransactionOptimismAdapter {
	static fromRPCTransaction(
		rpcTx: any,
		chainId: number,
		receipt?: any | null,
	): Transaction {
		const transaction: Transaction = {
			hash: rpcTx.hash,
			from: rpcTx.from,
			to: rpcTx.to,
			value: BigInt(rpcTx.value).toString(),
			gas: BigInt(rpcTx.gas).toString(),
			gasPrice: BigInt(rpcTx.gasPrice).toString(),
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
			const optimismReceipt: TransactionReceiptOptimism = {
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
				// Optimism-specific fields
				l1Fee: receipt.l1Fee || "0",
				l1GasPrice: receipt.l1GasPrice || "0",
				l1GasUsed: receipt.l1GasUsed || "0",
				l1FeeScalar: receipt.l1FeeScalar || "1",
			};
			transaction.receipt = optimismReceipt;
		}

		return transaction;
	}
}
