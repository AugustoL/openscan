// src/services/EVM/Optimism/adapters/block.ts
import type { RPCBlock } from "../../../../types";
import type { Block } from "../../../../types";

export class BlockOptimismAdapter {
	static fromRPCBlock(rpcBlock: RPCBlock, chainId: number): Block {
		console.log("Optimism block:", rpcBlock);
		// Optimism blocks use the same format as Ethereum
		return {
			number: rpcBlock.number,
			hash: rpcBlock.hash,
			parentHash: rpcBlock.parentHash,
			timestamp: rpcBlock.timestamp,
			nonce: rpcBlock.nonce,
			difficulty: BigInt(rpcBlock.difficulty || 0).toString(),
			gasLimit: BigInt(rpcBlock.gasLimit).toString(),
			gasUsed: BigInt(rpcBlock.gasUsed).toString(),
			miner: rpcBlock.miner,
			extraData: rpcBlock.extraData,
			transactions: Array.isArray(rpcBlock.transactions)
				? rpcBlock.transactions.map((tx: any) =>
						typeof tx === "string" ? tx : tx.hash,
					)
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
		};
	}
}
