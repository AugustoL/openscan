// src/services/EVM/L1/fetchers/networkStats.ts
import { RPCClient } from "../../common/RPCClient";
import type { NetworkStats } from "../../../../types";

export class NetworkStatsFetcher {
	constructor(
		private rpcClient: RPCClient,
		private chainId: number,
	) {}

	async getNetworkStats(): Promise<NetworkStats> {
		const [gasPrice, syncing, blockNumber] = await Promise.all([
			this.rpcClient.call<string>("eth_gasPrice", []),
			this.rpcClient.call<boolean | object>("eth_syncing", []),
			this.rpcClient.call<string>("eth_blockNumber", []),
		]);

		const metadata =
			this.chainId === 31337
				? await this.rpcClient.call<string>("hardhat_metadata", [])
				: "";

		// eth_syncing returns false when not syncing, or an object with sync status when syncing
		const isSyncing = typeof syncing === "object";

		return {
			currentGasPrice: gasPrice,
			isSyncing,
			currentBlockNumber: blockNumber,
			metadata: metadata,
		};
	}

	async getGasPrice(): Promise<string> {
		return await this.rpcClient.call<string>("eth_gasPrice", []);
	}

	async getSyncingStatus(): Promise<boolean> {
		const result = await this.rpcClient.call<boolean | object>(
			"eth_syncing",
			[],
		);
		return typeof result === "object";
	}

	async getBlockNumber(): Promise<string> {
		return await this.rpcClient.call<string>("eth_blockNumber", []);
	}

	getChainId(): number {
		return this.chainId;
	}
}
