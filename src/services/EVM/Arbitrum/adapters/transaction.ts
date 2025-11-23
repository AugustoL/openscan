// src/services/EVM/Arbitrum/adapters/transaction.ts
import type { RPCTransaction, RPCTransactionReceipt } from "../../../../types";
import type {
	TransactionArbitrum,
	TransactionReceiptArbitrum,
} from "../../../../types";

export class TransactionArbitrumAdapter {
	static fromRPCTransaction(
		rpcTx: any,
		chainId: number,
		receipt?: any | null,
	): TransactionArbitrum {
		const transaction: TransactionArbitrum = {
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
			// Arbitrum-specific field
			requestId: rpcTx.requestId || "0x0",
		};

		if (receipt) {
			const arbitrumReceipt: TransactionReceiptArbitrum = {
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
				// Arbitrum-specific fields
				l1BlockNumber: receipt.l1BlockNumber || "0",
				gasUsedForL1: receipt.gasUsedForL1 || "0",
			};
			transaction.receipt = arbitrumReceipt;
		}

		return transaction;
	}
}
