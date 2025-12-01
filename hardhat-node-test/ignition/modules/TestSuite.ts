import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestSuiteModule", (m) => {
	// Deploy ERC20 Tokens
	const tokenA = m.contract(
		"TestToken",
		["Token A", "TKNA", 1_000_000n * 10n ** 18n],
		{ id: "TokenA" },
	);
	const tokenB = m.contract(
		"TestToken",
		["Token B", "TKNB", 1_000_000n * 10n ** 18n],
		{ id: "TokenB" },
	);
	const stableToken = m.contract(
		"TestToken",
		["Stable Coin", "USDT", 10_000_000n * 10n ** 18n],
		{ id: "StableToken" },
	);

	// Deploy NFT
	const testNFT = m.contract("TestNFT", [
		"Test NFT Collection",
		"TNFT",
		"https://api.example.com/nft/",
	]);

	// Deploy SimpleSwap with Token A and Token B
	const simpleSwap = m.contract("SimpleSwap", [tokenA, tokenB]);

	// Deploy Vault with Stable Token
	// minDeposit: 100 tokens, maxDeposit: 10000 tokens, fee: 50 basis points (0.5%), lockDuration: 0 seconds (for testing)
	const vault = m.contract("Vault", [
		stableToken,
		100n * 10n ** 18n, // minDeposit
		10_000n * 10n ** 18n, // maxDeposit
		50n, // withdrawalFee (0.5%)
		0n, // lockDuration (0 for easy testing)
	]);

	// Deploy Multicall
	const multicall = m.contract("Multicall");

	// Deploy Counter
	const counter = m.contract("Counter");

	// Deploy OpenScanPayment
	const deployer = m.getAccount(0);
	const openScanPayment = m.contract("OpenScanPayment", [deployer]);

	return {
		tokenA,
		tokenB,
		stableToken,
		testNFT,
		simpleSwap,
		vault,
		multicall,
		counter,
		openScanPayment,
	};
});
