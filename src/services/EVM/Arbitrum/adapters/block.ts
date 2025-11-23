// src/services/EVM/Arbitrum/adapters/block.ts
import type { RPCBlock } from "../../../../types";
import type { BlockArbitrum } from "../../../../types";

export class BlockArbitrumAdapter {
	static fromRPCBlock(rpcBlock: any, chainId: number): BlockArbitrum {
		console.log("Arbitrum block:", rpcBlock);
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
			// Arbitrum-specific fields
			l1BlockNumber: rpcBlock.l1BlockNumber || "0",
			sendCount: rpcBlock.sendCount || "0",
			sendRoot:
				rpcBlock.sendRoot ||
				"0x0000000000000000000000000000000000000000000000000000000000000000",
		};
	}
}
