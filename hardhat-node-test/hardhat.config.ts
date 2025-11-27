import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
	plugins: [hardhatToolboxViemPlugin],
	solidity: {
		profiles: {
			default: {
				version: "0.8.28",
			},
			production: {
				version: "0.8.28",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		},
	},
	networks: {
		// Network for running the node
		hardhatMainnet: {
			type: "edr-simulated",
			chainType: "l1",
			throwOnCallFailures: false,
			throwOnTransactionFailures: false,
		},
		// HTTP connection to localhost node
		localhost: {
			type: "http",
			url: "http://127.0.0.1:8545",
		}
	},
});
