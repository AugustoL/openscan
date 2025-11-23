import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { getSupportedChains } from "../config";

const supportedChains = getSupportedChains();
// Ensure we have at least one chain for the config

export const networkConfig = getDefaultConfig({
	appName: "Open Scan",
	projectId: "2b05839e1b9385420e43ffd8d982cb04",
	chains: supportedChains as [any, ...any[]],
	ssr: false,
});
