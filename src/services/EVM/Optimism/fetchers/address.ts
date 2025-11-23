// src/services/EVM/Optimism/fetchers/address.ts
import { RPCClient } from "../../common/RPCClient";

export class AddressFetcher {
	constructor(
		private rpcClient: RPCClient,
		private chainId: number,
	) {}

	async getBalance(
		address: string,
		blockNumber: number | "latest" = "latest",
	): Promise<bigint> {
		const blockParam =
			blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
		const result = await this.rpcClient.call<string>("eth_getBalance", [
			address,
			blockParam,
		]);
		return BigInt(result);
	}

	async getCode(
		address: string,
		blockNumber: number | "latest" = "latest",
	): Promise<string> {
		const blockParam =
			blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
		return await this.rpcClient.call<string>("eth_getCode", [
			address,
			blockParam,
		]);
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

	async getStorageAt(
		address: string,
		position: string,
		blockNumber: number | "latest" = "latest",
	): Promise<string> {
		const blockParam =
			blockNumber === "latest" ? "latest" : `0x${blockNumber.toString(16)}`;
		return await this.rpcClient.call<string>("eth_getStorageAt", [
			address,
			position,
			blockParam,
		]);
	}

	getChainId(): number {
		return this.chainId;
	}
}
