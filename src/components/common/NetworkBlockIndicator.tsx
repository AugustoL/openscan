import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
// Network configuration with logos
import arbitrumLogo from "../../assets/arbitrum-logo.svg";
import baseLogo from "../../assets/base-logo.svg";
import hardhatLogo from "../../assets/hardhat-logo.svg";
import optimismLogo from "../../assets/optimism-logo.svg";
import { getRPCUrls } from "../../config/rpcConfig";
import { AppContext } from "../../context/AppContext";
import { RPCClient } from "../../services/EVM/common/RPCClient";

interface NetworkInfo {
  name: string;
  logo: string | null;
  color: string;
}

const NETWORK_INFO: Record<number, NetworkInfo> = {
  1: { name: "Ethereum", logo: null, color: "#627EEA" },
  11155111: { name: "Sepolia", logo: null, color: "#F0CDC2" },
  42161: { name: "Arbitrum", logo: arbitrumLogo, color: "#28A0F0" },
  10: { name: "Optimism", logo: optimismLogo, color: "#FF0420" },
  8453: { name: "Base", logo: baseLogo, color: "#0052FF" },
  56: { name: "BSC", logo: "bsc", color: "#F0B90B" },
  97: { name: "BSC Testnet", logo: "bsc", color: "#F0B90B" },
  137: { name: "Polygon", logo: "polygon", color: "#8247E5" },
  31337: { name: "Localhost", logo: hardhatLogo, color: "#FFF100" },
};

// Ethereum SVG for networks without a logo
const EthereumIcon = ({ color }: { color: string }) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: <TODO>
  <svg width="20" height="20" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg">
    <path fill={color} d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
    <path fill={`${color}99`} d="M127.962 0 0 212.32l127.962 75.639V154.158z" />
    <path fill={color} d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z" />
    <path fill={`${color}99`} d="M127.962 416.905v-104.72L0 236.585z" />
  </svg>
);

// BSC/BNB SVG icon
const BscIcon = ({ color, opacity = 1 }: { color: string; opacity?: number }) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: <TODO>
  <svg width="20" height="20" viewBox="0 0 126.61 126.61" xmlns="http://www.w3.org/2000/svg">
    <path
      fill={color}
      fillOpacity={opacity}
      d="m38.73 53.2 24.59-24.58 24.6 24.6 14.3-14.31L63.32 0l-38.9 38.9zM0 63.31l14.3-14.31 14.31 14.31-14.31 14.3zM38.73 73.41l24.59 24.59 24.6-24.6 14.31 14.29-38.9 38.91-38.91-38.88zM97.99 63.31l14.3-14.31 14.32 14.31-14.31 14.3z"
    />
    <path
      fill={color}
      fillOpacity={opacity}
      d="m77.83 63.3-14.51-14.52-10.73 10.73-1.24 1.23-2.54 2.54 14.51 14.5 14.51-14.47z"
    />
  </svg>
);

// Polygon SVG icon
const PolygonIcon = ({ color }: { color: string }) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: <TODO>
  <svg width="20" height="20" viewBox="0 0 38 33" xmlns="http://www.w3.org/2000/svg">
    <path
      fill={color}
      d="M29 10.2c-.7-.4-1.6-.4-2.4 0L21 13.5l-3.8 2.1-5.5 3.3c-.7.4-1.6.4-2.4 0L5 16.3c-.7-.4-1.2-1.2-1.2-2.1v-5c0-.8.4-1.6 1.2-2.1l4.3-2.5c.7-.4 1.6-.4 2.4 0L16 7.2c.7.4 1.2 1.2 1.2 2.1v3.3l3.8-2.2V7c0-.8-.4-1.6-1.2-2.1l-8-4.7c-.7-.4-1.6-.4-2.4 0L1.2 5C.4 5.4 0 6.2 0 7v9.4c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.4 0l5.5-3.2 3.8-2.2 5.5-3.2c.7-.4 1.6-.4 2.4 0l4.3 2.5c.7.4 1.2 1.2 1.2 2.1v5c0 .8-.4 1.6-1.2 2.1L29 29.5c-.7.4-1.6.4-2.4 0l-4.3-2.5c-.7-.4-1.2-1.2-1.2-2.1v-3.2l-3.8 2.2v3.3c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.4 0l8.1-4.7c.7-.4 1.2-1.2 1.2-2.1V18c0-.8-.4-1.6-1.2-2.1L29 10.2z"
    />
  </svg>
);

interface NetworkBlockIndicatorProps {
  className?: string;
}

export function NetworkBlockIndicator({ className }: NetworkBlockIndicatorProps) {
  const location = useLocation();
  const { rpcUrls } = useContext(AppContext);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract chainId from the pathname (e.g., /1/blocks -> 1)
  const chainId = useMemo(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    return pathSegments[0] && !Number.isNaN(Number(pathSegments[0]))
      ? Number(pathSegments[0])
      : null;
  }, [location.pathname]);

  const networkInfo = chainId ? NETWORK_INFO[chainId] : null;

  useEffect(() => {
    if (!chainId) {
      setBlockNumber(null);
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchBlockNumber = async () => {
      try {
        const urls = getRPCUrls(chainId, rpcUrls);
        const client = new RPCClient(urls);
        const result = await client.call<string>("eth_blockNumber", []);
        if (isMounted) {
          setBlockNumber(parseInt(result, 16));
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch block number:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    fetchBlockNumber();

    // Poll for new blocks every 12 seconds (Ethereum average block time)
    intervalId = setInterval(fetchBlockNumber, 12000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [chainId, rpcUrls]);

  if (!chainId || !networkInfo) return null;

  return (
    <div
      className={`network-block-indicator ${className || ""}`}
      style={{ borderColor: `${networkInfo.color}40` }}
      title={networkInfo.name}
    >
      <div className="network-block-pulse" style={{ background: networkInfo.color }} />
      <div className="network-block-logo">
        {networkInfo.logo === "bsc" ? (
          <BscIcon color={networkInfo.color} />
        ) : networkInfo.logo === "polygon" ? (
          <PolygonIcon color={networkInfo.color} />
        ) : networkInfo.logo ? (
          <img src={networkInfo.logo} alt={networkInfo.name} />
        ) : (
          <EthereumIcon color={networkInfo.color} />
        )}
      </div>
      <span className="network-block-number">
        {isLoading ? "..." : blockNumber !== null ? `#${blockNumber.toLocaleString()}` : "---"}
      </span>
    </div>
  );
}

export default NetworkBlockIndicator;
