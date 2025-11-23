// src/services/EVM/L1/fetchers/mainnet/transaction.ts
import { RPCClient } from "../../common/RPCClient";
import type { RPCTransaction, RPCTransactionReceipt } from "../../../../types";

export class TransactionFetcher {
	constructor(
		private rpcClient: RPCClient,
		private chainId: number,
	) {}

	async getTransaction(txHash: string): Promise<RPCTransaction | null> {
		return await this.rpcClient.call<RPCTransaction>(
			"eth_getTransactionByHash",
			[txHash],
		);
	}

	async getTransactionReceipt(
		txHash: string,
	): Promise<RPCTransactionReceipt | null> {
		return await this.rpcClient.call<RPCTransactionReceipt>(
			"eth_getTransactionReceipt",
			[txHash],
		);
	}

	async getTransactionCount(
		address: string,
		blockNumber: number | "latest" = "latest",
	): Promise<number> {
		const blockParam =
			blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
		const result = await this.rpcClient.call<string>(
			"eth_getTransactionCount",
			[address, blockParam],
		);
		return parseInt(result, 16);
	}

	getChainId(): number {
		return this.chainId;
	}
}
