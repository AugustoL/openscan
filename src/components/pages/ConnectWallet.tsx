import { ConnectButton } from "@rainbow-me/rainbowkit";

const ConnectWallet = () => {
	return (
		<div className="connect-wallet-content">
			<h2>Connect an Ethereum wallet to use FlashLender</h2>
			<div className="connect-button-wrapper">
				<ConnectButton
					accountStatus={{
						smallScreen: "avatar",
						largeScreen: "full",
					}}
				/>
			</div>
		</div>
	);
};

export default ConnectWallet;
