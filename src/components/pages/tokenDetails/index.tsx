import type React from "react";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../context";
import Loader from "../../common/Loader";
import ERC721TokenDetails from "./ERC721TokenDisplay";
import ERC1155TokenDetails from "./ERC1155TokenDisplay";

type NFTType = "erc721" | "erc1155" | "unknown";

/**
 * Check if contract supports ERC721 (interface ID: 0x80ac58cd)
 */
async function supportsERC721(contractAddress: string, rpcUrl: string): Promise<boolean> {
  try {
    // supportsInterface(bytes4) selector: 0x01ffc9a7
    // ERC721 interface ID: 0x80ac58cd
    const data = "0x01ffc9a780ac58cd00000000000000000000000000000000000000000000000000000000";

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
        id: 1,
      }),
    });

    const result = await response.json();
    if (result.error || !result.result) return false;

    // Check if result is true (non-zero)
    return result.result !== "0x" && BigInt(result.result) === BigInt(1);
  } catch {
    return false;
  }
}

/**
 * Check if contract supports ERC1155 (interface ID: 0xd9b67a26)
 */
async function supportsERC1155(contractAddress: string, rpcUrl: string): Promise<boolean> {
  try {
    // supportsInterface(bytes4) selector: 0x01ffc9a7
    // ERC1155 interface ID: 0xd9b67a26
    const data = "0x01ffc9a7d9b67a2600000000000000000000000000000000000000000000000000000000";

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: contractAddress, data }, "latest"],
        id: 1,
      }),
    });

    const result = await response.json();
    if (result.error || !result.result) return false;

    // Check if result is true (non-zero)
    return result.result !== "0x" && BigInt(result.result) === BigInt(1);
  } catch {
    return false;
  }
}

const NFTTokenDetails: React.FC = () => {
  const { networkId, address: contractAddress } = useParams<{
    networkId?: string;
    address?: string;
    tokenId?: string;
  }>();

  const { rpcUrls } = useContext(AppContext);
  const [nftType, setNftType] = useState<NFTType | null>(null);
  const [loading, setLoading] = useState(true);

  const numericNetworkId = Number(networkId) || 1;

  // Get RPC URL
  const rpcUrlsForChain = rpcUrls[numericNetworkId as keyof typeof rpcUrls];
  const rpcUrl = Array.isArray(rpcUrlsForChain) ? rpcUrlsForChain[0] : rpcUrlsForChain;

  // Detect NFT type
  useEffect(() => {
    if (!contractAddress || !rpcUrl) {
      setNftType("unknown");
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([supportsERC721(contractAddress, rpcUrl), supportsERC1155(contractAddress, rpcUrl)])
      .then(([isERC721, isERC1155]) => {
        if (isERC721) {
          setNftType("erc721");
        } else if (isERC1155) {
          setNftType("erc1155");
        } else {
          // Fallback: try ERC721 first (more common for individual token pages)
          setNftType("erc721");
        }
      })
      .catch(() => {
        // Default to ERC721 on error
        setNftType("erc721");
      })
      .finally(() => setLoading(false));
  }, [contractAddress, rpcUrl]);

  if (loading) {
    return (
      <div className="container-wide">
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">NFT Token</span>
          </div>
          <div className="card-content-loading">
            <Loader text="Detecting token type..." />
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate component based on detected type
  if (nftType === "erc1155") {
    return <ERC1155TokenDetails />;
  }

  // Default to ERC721
  return <ERC721TokenDetails />;
};

export default NFTTokenDetails;
