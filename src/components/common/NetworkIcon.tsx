import type React from "react";
import arbitrumLogo from "../../assets/arbitrum-logo.svg";
import baseLogo from "../../assets/base-logo.svg";
import hardhatLogo from "../../assets/hardhat-logo.svg";
import optimismLogo from "../../assets/optimism-logo.svg";
import type { NetworkConfig } from "../../config/networks";

interface NetworkIconProps {
  network: NetworkConfig;
  size?: number;
}

// Ethereum SVG icon
const EthereumIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: <TODO>
  <svg width={size} height={size} viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg">
    <path fill={color} d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
    <path fill={`${color}99`} d="M127.962 0 0 212.32l127.962 75.639V154.158z" />
    <path fill={color} d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z" />
    <path fill={`${color}99`} d="M127.962 416.905v-104.72L0 236.585z" />
  </svg>
);

// BSC/BNB SVG icon
const BscIcon: React.FC<{ color: string; size: number; opacity?: number }> = ({
  color,
  size,
  opacity = 1,
}) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: <TODO>
  <svg width={size} height={size} viewBox="0 0 126.61 126.61" xmlns="http://www.w3.org/2000/svg">
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
const PolygonIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: <TODO>
  <svg width={size} height={size} viewBox="0 0 38 33" xmlns="http://www.w3.org/2000/svg">
    <path
      fill={color}
      d="M29 10.2c-.7-.4-1.6-.4-2.4 0L21 13.5l-3.8 2.1-5.5 3.3c-.7.4-1.6.4-2.4 0L5 16.3c-.7-.4-1.2-1.2-1.2-2.1v-5c0-.8.4-1.6 1.2-2.1l4.3-2.5c.7-.4 1.6-.4 2.4 0L16 7.2c.7.4 1.2 1.2 1.2 2.1v3.3l3.8-2.2V7c0-.8-.4-1.6-1.2-2.1l-8-4.7c-.7-.4-1.6-.4-2.4 0L1.2 5C.4 5.4 0 6.2 0 7v9.4c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.4 0l5.5-3.2 3.8-2.2 5.5-3.2c.7-.4 1.6-.4 2.4 0l4.3 2.5c.7.4 1.2 1.2 1.2 2.1v5c0 .8-.4 1.6-1.2 2.1L29 29.5c-.7.4-1.6.4-2.4 0l-4.3-2.5c-.7-.4-1.2-1.2-1.2-2.1v-3.2l-3.8 2.2v3.3c0 .8.4 1.6 1.2 2.1l8.1 4.7c.7.4 1.6.4 2.4 0l8.1-4.7c.7-.4 1.2-1.2 1.2-2.1V18c0-.8-.4-1.6-1.2-2.1L29 10.2z"
    />
  </svg>
);

export const NetworkIcon: React.FC<NetworkIconProps> = ({ network, size = 32 }) => {
  switch (network.logoType) {
    case "ethereum":
      return <EthereumIcon color={network.color} size={size} />;
    case "bsc":
      return <BscIcon color={network.color} size={size} opacity={network.isTestnet ? 0.7 : 1} />;
    case "polygon":
      return <PolygonIcon color={network.color} size={size} />;
    case "arbitrum":
      return <img src={arbitrumLogo} alt="Arbitrum" width={size} height={size} />;
    case "optimism":
      return <img src={optimismLogo} alt="Optimism" width={size} height={size} />;
    case "base":
      return <img src={baseLogo} alt="Base" width={size} height={size} />;
    case "hardhat":
      return <img src={hardhatLogo} alt="Localhost" width={size} height={size} />;
    default:
      return <EthereumIcon color={network.color} size={size} />;
  }
};

export default NetworkIcon;
