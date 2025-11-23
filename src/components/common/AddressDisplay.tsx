import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useSourcify } from "../../hooks/useSourcify";
import { Address } from "../../types";
import { AppContext } from "../../context";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther, encodeFunctionData } from "viem";

// @ts-ignore
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface AddressDisplayProps {
  address: Address;
  addressHash: string;
  chainId?: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  addressHash,
  chainId = "1",
}) => {
  const [storageSlot, setStorageSlot] = useState("");
  const [storageValue, setStorageValue] = useState("");
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [selectedWriteFunction, setSelectedWriteFunction] = useState<any>(null);
  const [selectedReadFunction, setSelectedReadFunction] = useState<any>(null);
  const [functionInputs, setFunctionInputs] = useState<Record<string, string>>(
    {},
  );
  const [readFunctionResult, setReadFunctionResult] = useState<any>(null);
  const [isReadingFunction, setIsReadingFunction] = useState(false);
  const { jsonFiles, rpcUrls } = useContext(AppContext);

  // Wagmi hooks for contract interaction
  const {
    data: hash,
    writeContract,
    isPending,
    isError,
    error,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const isContract = address.code && address.code !== "0x";

  // Fetch Sourcify data only if it's a contract
  const {
    data: sourcifyData,
    loading: sourcifyLoading,
    isVerified,
  } = useSourcify(Number(chainId), isContract ? addressHash : undefined, true);

  const truncate = (str: string, start = 6, end = 4) => {
    if (!str) return "";
    if (str.length <= start + end) return str;
    return `${str.slice(0, start)}...${str.slice(-end)}`;
  };

  const formatBalance = (balance: string) => {
    try {
      const eth = Number(balance) / 1e18;
      return `${eth.toFixed(6)} ETH`;
    } catch (e) {
      return balance;
    }
  };

  const formatValue = (value: string) => {
    try {
      const eth = Number(value) / 1e18;
      return `${eth.toFixed(6)} ETH`;
    } catch (e) {
      return "0 ETH";
    }
  };

  const handleGetStorage = () => {
    // Check if the slot exists in the storeageAt object
    if (address.storeageAt && address.storeageAt[storageSlot]) {
      setStorageValue(address.storeageAt[storageSlot]);
    } else {
      setStorageValue(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );
    }
  };

  const handleWriteFunction = async () => {
    if (!selectedWriteFunction) return;

    try {
      // Prepare function arguments
      const args: any[] = [];
      if (
        selectedWriteFunction.inputs &&
        selectedWriteFunction.inputs.length > 0
      ) {
        for (const input of selectedWriteFunction.inputs) {
          const paramName =
            input.name || `param${selectedWriteFunction.inputs.indexOf(input)}`;
          const value = functionInputs[paramName];

          if (!value && value !== "0") {
            alert(`Please provide value for ${paramName}`);
            return;
          }

          args.push(value);
        }
      }

      // Prepare transaction value for payable functions
      let txValue: bigint | undefined;
      if (
        selectedWriteFunction.stateMutability === "payable" &&
        functionInputs["_value"]
      ) {
        try {
          txValue = parseEther(functionInputs["_value"]);
        } catch (e) {
          alert("Invalid ETH value");
          return;
        }
      }

      // Call the contract
      writeContract({
        address: addressHash as `0x${string}`,
        abi: contractData?.abi || [],
        functionName: selectedWriteFunction.name,
        args: args,
        value: txValue,
      });
    } catch (err) {
      console.error("Error writing to contract:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleReadFunction = async () => {
    if (!selectedReadFunction || !contractData) return;

    setIsReadingFunction(true);
    setReadFunctionResult(null);

    try {
      // Get RPC URL for the current chain
      const chainIdNum = Number(chainId);
      const rpcUrlsForChain = rpcUrls[chainIdNum as keyof typeof rpcUrls];
      
      if (!rpcUrlsForChain) {
        throw new Error(`No RPC URL configured for chain ${chainId}`);
      }

      // Get first RPC URL (could be string or array)
      const rpcUrl = Array.isArray(rpcUrlsForChain) 
        ? rpcUrlsForChain[0] 
        : rpcUrlsForChain;

      if (!rpcUrl) {
        // Defensive: ensure rpcUrl is defined before calling fetch
        throw new Error(`No RPC URL configured for chain ${chainId}`);
      }

      // Prepare function arguments
      const args: any[] = [];
      if (
        selectedReadFunction.inputs &&
        selectedReadFunction.inputs.length > 0
      ) {
        for (const input of selectedReadFunction.inputs) {
          const paramName =
            input.name || `param${selectedReadFunction.inputs.indexOf(input)}`;
          const value = functionInputs[paramName];

          if (!value && value !== "0") {
            alert(`Please provide value for ${paramName}`);
            setIsReadingFunction(false);
            return;
          }

          args.push(value);
        }
      }

      // Use fetch to call the RPC directly for read functions
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: addressHash,
              data: encodeFunctionData({
                abi: contractData.abi,
                functionName: selectedReadFunction.name,
                args: args,
              }),
            },
            'latest',
          ],
          id: 1,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Contract call failed');
      }

      setReadFunctionResult(data.result);
    } catch (err) {
      console.error("Error reading from contract:", err);
      setReadFunctionResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsReadingFunction(false);
    }
  };

  // Check if we have local artifact data for this address
  const localArtifact = jsonFiles[addressHash.toLowerCase()];

  // Parse local artifact to sourcify format if it exists
  const parsedLocalData = localArtifact
    ? {
        name: localArtifact.contractName,
        compilerVersion: localArtifact.buildInfo?.solcLongVersion,
        evmVersion: localArtifact.buildInfo?.input?.settings?.evmVersion,
        abi: localArtifact.abi,
        files: localArtifact.sourceCode
          ? [
              {
                name: localArtifact.sourceName || "Contract.sol",
                path: localArtifact.sourceName || "Contract.sol",
                content: localArtifact.sourceCode,
              },
            ]
          : undefined,
        metadata: {
          language: localArtifact.buildInfo?.input?.language,
          compiler: localArtifact.buildInfo
            ? {
                version: localArtifact.buildInfo.solcVersion,
              }
            : undefined,
        },
        match: "perfect" as const,
        creation_match: null,
        runtime_match: null,
        chainId: chainId,
        address: addressHash,
        verifiedAt: undefined,
      }
    : null;

  // Use local artifact data if available and sourcify is not verified, otherwise use sourcify
  const contractData =
    isVerified && sourcifyData ? sourcifyData : parsedLocalData;

  // Debug: Log ABI information
  if (contractData && contractData.abi) {
    const allTypes = contractData.abi.map((item: any) => item.type);
    const uniqueTypes = Array.from(new Set(allTypes));
    const functionNames = contractData.abi
      .filter((item: any) => item.type === "function")
      .map((f: any) => f.name);
    console.log("Contract ABI Info:", {
      source: isVerified && sourcifyData ? "Sourcify" : "Local Artifact",
      totalItems: contractData.abi.length,
      functions: contractData.abi.filter(
        (item: any) => item.type === "function",
      ).length,
      events: contractData.abi.filter((item: any) => item.type === "event")
        .length,
      constructor: contractData.abi.filter(
        (item: any) => item.type === "constructor",
      ).length,
      fallback: contractData.abi.filter((item: any) => item.type === "fallback")
        .length,
      receive: contractData.abi.filter((item: any) => item.type === "receive")
        .length,
      other: contractData.abi.filter(
        (item: any) =>
          !["function", "event", "constructor", "fallback", "receive"].includes(
            item.type,
          ),
      ).length,
      allTypes: uniqueTypes,
      allFunctionNames: functionNames,
      hasTransfer: functionNames.includes("transfer"),
      hasTransferFrom: functionNames.includes("transferFrom"),
      hasApprove: functionNames.includes("approve"),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Address Header Card */}
      <div className="block-display-card">
        <div className="block-display-header">
          <span className="block-label">Address</span>
          <span
            className="block-number"
            style={{ fontFamily: "monospace", fontSize: "1.1rem" }}
          >
            {addressHash}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            marginBottom: "0",
          }}
        >
          {/* Type */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 16px",
              background: "rgba(16, 185, 129, 0.04)",
              borderRadius: "8px",
              borderLeft: "3px solid #10b981",
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                color: "#10b981",
                fontWeight: "600",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Type
            </span>
            <span
              style={{
                fontWeight: "600",
                color: isContract ? "#3b82f6" : "#10b981",
                fontFamily: "Outfit, sans-serif",
                fontSize: "0.95rem",
              }}
            >
              {isContract ? "📄 Contract" : "👤 EOA"}
            </span>
          </div>

          {/* Balance */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 16px",
              background: "rgba(16, 185, 129, 0.04)",
              borderRadius: "8px",
              borderLeft: "3px solid #10b981",
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                color: "#10b981",
                fontWeight: "600",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Balance
            </span>
            <span
              style={{
                fontWeight: "600",
                color: "#059669",
                fontFamily: "Outfit, sans-serif",
                fontSize: "0.95rem",
              }}
            >
              {formatBalance(address.balance)}
            </span>
          </div>

          {/* Transaction Count */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 16px",
              background: "rgba(16, 185, 129, 0.04)",
              borderRadius: "8px",
              borderLeft: "3px solid #10b981",
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                color: "#10b981",
                fontWeight: "600",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Transactions
            </span>
            <span
              style={{
                fontWeight: "600",
                color: "#059669",
                fontFamily: "Outfit, sans-serif",
                fontSize: "0.95rem",
              }}
            >
              {Number(address.txCount).toLocaleString()}
            </span>
          </div>

          {/* Verification (only for contracts) */}
          {isContract && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 16px",
                background: "rgba(16, 185, 129, 0.04)",
                borderRadius: "8px",
                borderLeft: "3px solid #10b981",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#10b981",
                  fontWeight: "600",
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                Verified
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {sourcifyLoading ? (
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.9rem",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    Checking...
                  </span>
                ) : isVerified || parsedLocalData ? (
                  <>
                    <span
                      style={{
                        color: "#10b981",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        fontFamily: "Outfit, sans-serif",
                      }}
                    >
                      ✓ Yes
                    </span>
                    {contractData?.match && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 6px",
                          background: "rgba(16, 185, 129, 0.2)",
                          borderRadius: "4px",
                          color: "#10b981",
                          fontWeight: "600",
                        }}
                      >
                        {contractData.match === "perfect"
                          ? parsedLocalData
                            ? "Local"
                            : "Perfect"
                          : "Partial"}
                      </span>
                    )}
                  </>
                ) : (
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.9rem",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    No
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contract Verification Details */}
      {isContract && (isVerified || parsedLocalData) && contractData && (
        <div className="block-display-card">
          <div
            className="block-display-header"
            style={{ cursor: "pointer" }}
            onClick={() => setShowContractDetails(!showContractDetails)}
          >
            <span className="block-label">Contract Details</span>
            <span style={{ fontSize: "1.2rem", color: "#10b981" }}>
              {showContractDetails ? "▼" : "▶"}
            </span>
          </div>

          {showContractDetails && (
            <div className="block-display-grid">
              {contractData.name && (
                <div className="block-detail-item">
                  <span className="detail-label">Contract Name</span>
                  <span
                    className="detail-value"
                    style={{ color: "#10b981", fontWeight: "600" }}
                  >
                    {contractData.name}
                  </span>
                </div>
              )}

              {contractData.compilerVersion && (
                <div className="block-detail-item">
                  <span className="detail-label">Compiler Version</span>
                  <span className="detail-value">
                    {contractData.compilerVersion}
                  </span>
                </div>
              )}

              {contractData.evmVersion && (
                <div className="block-detail-item">
                  <span className="detail-label">EVM Version</span>
                  <span className="detail-value">
                    {contractData.evmVersion}
                  </span>
                </div>
              )}

              {contractData.chainId && (
                <div className="block-detail-item">
                  <span className="detail-label">Chain ID</span>
                  <span className="detail-value">{contractData.chainId}</span>
                </div>
              )}

              {contractData.verifiedAt && (
                <div className="block-detail-item">
                  <span className="detail-label">Verified At</span>
                  <span className="detail-value">
                    {new Date(contractData.verifiedAt).toLocaleString()}
                  </span>
                </div>
              )}

              {contractData.match && (
                <div className="block-detail-item">
                  <span className="detail-label">Match Type</span>
                  <span
                    className="detail-value"
                    style={{
                      color:
                        contractData.match === "perfect"
                          ? "#10b981"
                          : "#f59e0b",
                      fontWeight: "600",
                    }}
                  >
                    {contractData.match.toUpperCase()}
                  </span>
                </div>
              )}

              {contractData.creation_match && (
                <div className="block-detail-item">
                  <span className="detail-label">Creation Match</span>
                  <span
                    className="detail-value"
                    style={{
                      color:
                        contractData.creation_match === "perfect"
                          ? "#10b981"
                          : "#f59e0b",
                      fontWeight: "600",
                    }}
                  >
                    {contractData.creation_match.toUpperCase()}
                  </span>
                </div>
              )}

              {contractData.runtime_match && (
                <div className="block-detail-item">
                  <span className="detail-label">Runtime Match</span>
                  <span
                    className="detail-value"
                    style={{
                      color:
                        contractData.runtime_match === "perfect"
                          ? "#10b981"
                          : "#f59e0b",
                      fontWeight: "600",
                    }}
                  >
                    {contractData.runtime_match.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Contract Bytecode */}
              <div
                className="block-detail-item"
                style={{ gridColumn: "1 / -1" }}
              >
                <span className="detail-label">Contract Bytecode</span>
                <div
                  style={{
                    marginTop: "8px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                    color: "#10b981",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {address.code}
                </div>
              </div>

              {/* Source Code */}
              {((contractData.files && contractData.files.length > 0) ||
                (contractData as any).sources) &&
                (() => {
                  // Prepare source files array - either from files or sources object
                  const sources = (contractData as any).sources;
                  const sourceFiles =
                    contractData.files && contractData.files.length > 0
                      ? contractData.files
                      : sources
                        ? Object.entries(sources).map(
                            ([path, source]: [string, any]) => ({
                              name: path,
                              path: path,
                              content: source.content || "",
                            }),
                          )
                        : [];

                  return sourceFiles.length > 0 ? (
                    <div
                      className="block-detail-item"
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                        onClick={() => {
                          const elem = document.getElementById(
                            "source-code-content",
                          );
                          const icon =
                            document.getElementById("source-code-icon");
                          if (elem && icon) {
                            const isHidden = elem.style.display === "none";
                            elem.style.display = isHidden ? "block" : "none";
                            icon.textContent = isHidden ? "▼" : "▶";
                          }
                        }}
                      >
                        <span className="detail-label">Source Code</span>
                        <span
                          id="source-code-icon"
                          style={{ fontSize: "0.9rem", color: "#10b981" }}
                        >
                          ▶
                        </span>
                      </div>
                      <div
                        id="source-code-content"
                        style={{
                          marginTop: "8px",
                          display: "none",
                        }}
                      >
                        {sourceFiles.map((file: any, idx: number) => (
                          <div key={idx} style={{ marginBottom: "16px" }}>
                            <div
                              style={{
                                padding: "8px 12px",
                                background: "rgba(16, 185, 129, 0.08)",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                borderRadius: "6px 6px 0 0",
                                fontFamily: "monospace",
                                fontSize: "0.85rem",
                                color: "#10b981",
                                fontWeight: "600",
                              }}
                            >
                              📄 {file.name || file.path}
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                padding: "16px",
                                background: "rgba(0, 0, 0, 0.3)",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                borderTop: "none",
                                borderRadius: "0 0 6px 6px",
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                                color: "#e5e7eb",
                                maxHeight: "400px",
                                overflowY: "auto",
                                overflowX: "auto",
                                whiteSpace: "pre",
                              }}
                            >
                              {file.content}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

              {/* Contract ABI */}
              {contractData.abi && contractData.abi.length > 0 && (
                <div
                  className="block-detail-item"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span className="detail-label">Contract ABI</span>
                    <ConnectButton.Custom>
                      {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        authenticationStatus,
                        mounted,
                      }: any) => {
                        const ready =
                          mounted && authenticationStatus !== "loading";
                        const connected =
                          ready &&
                          account &&
                          chain &&
                          (!authenticationStatus ||
                            authenticationStatus === "authenticated");

                        return (
                          <div
                            {...(!ready && {
                              "aria-hidden": true,
                              style: {
                                opacity: 0,
                                pointerEvents: "none",
                                userSelect: "none",
                              },
                            })}
                          >
                            {(() => {
                              if (!connected) {
                                return (
                                  <button
                                    onClick={openConnectModal}
                                    type="button"
                                    style={{
                                      padding: "8px 16px",
                                      background: "rgba(16, 185, 129, 0.15)",
                                      color: "#10b981",
                                      border:
                                        "1px solid rgba(16, 185, 129, 0.3)",
                                      borderRadius: "6px",
                                      fontSize: "0.85rem",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "rgba(16, 185, 129, 0.25)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "rgba(16, 185, 129, 0.15)";
                                    }}
                                  >
                                    Connect Wallet
                                  </button>
                                );
                              }

                              if (chain.unsupported) {
                                return (
                                  <button
                                    onClick={openChainModal}
                                    type="button"
                                    style={{
                                      padding: "8px 16px",
                                      background: "rgba(239, 68, 68, 0.15)",
                                      color: "#ef4444",
                                      border:
                                        "1px solid rgba(239, 68, 68, 0.3)",
                                      borderRadius: "6px",
                                      fontSize: "0.85rem",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Wrong Network
                                  </button>
                                );
                              }

                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                  }}
                                >
                                  <button
                                    onClick={openChainModal}
                                    type="button"
                                    style={{
                                      padding: "6px 12px",
                                      background: "rgba(59, 130, 246, 0.15)",
                                      color: "#3b82f6",
                                      border:
                                        "1px solid rgba(59, 130, 246, 0.3)",
                                      borderRadius: "6px",
                                      fontSize: "0.8rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {chain.hasIcon && chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? "Chain icon"}
                                        src={chain.iconUrl}
                                        style={{
                                          width: 16,
                                          height: 16,
                                          borderRadius: "50%",
                                        }}
                                      />
                                    )}
                                    {chain.name}
                                  </button>
                                  <button
                                    onClick={openAccountModal}
                                    type="button"
                                    style={{
                                      padding: "6px 12px",
                                      background: "rgba(16, 185, 129, 0.15)",
                                      color: "#10b981",
                                      border:
                                        "1px solid rgba(16, 185, 129, 0.3)",
                                      borderRadius: "6px",
                                      fontSize: "0.8rem",
                                      cursor: "pointer",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {account.displayName}
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    {/* Read Functions (view/pure) */}
                    {(() => {
                      const readFunctions = contractData.abi.filter(
                        (item: any) =>
                          item.type === "function" &&
                          (item.stateMutability === "view" ||
                            item.stateMutability === "pure"),
                      );
                      return (
                        readFunctions.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "#10b981",
                                marginBottom: "6px",
                                fontWeight: "600",
                              }}
                            >
                              Read Functions ({readFunctions.length})
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {readFunctions.map((func: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setSelectedReadFunction(func);
                                    setSelectedWriteFunction(null);
                                    setFunctionInputs({});
                                    setReadFunctionResult(null);
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    background:
                                      selectedReadFunction?.name === func.name
                                        ? "rgba(59, 130, 246, 0.3)"
                                        : "rgba(59, 130, 246, 0.15)",
                                    color: "#3b82f6",
                                    border:
                                      selectedReadFunction?.name === func.name
                                        ? "1px solid rgba(59, 130, 246, 0.5)"
                                        : "1px solid transparent",
                                    borderRadius: "6px",
                                    fontSize: "0.8rem",
                                    fontFamily: "monospace",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedReadFunction?.name !== func.name) {
                                      e.currentTarget.style.background =
                                        "rgba(59, 130, 246, 0.25)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedReadFunction?.name !== func.name) {
                                      e.currentTarget.style.background =
                                        "rgba(59, 130, 246, 0.15)";
                                    }
                                  }}
                                >
                                  {func.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      );
                    })()}

                    {/* Write Functions (payable/nonpayable) */}
                    {(() => {
                      const writeFunctions = contractData.abi.filter(
                        (item: any) =>
                          item.type === "function" &&
                          (item.stateMutability === "payable" ||
                            item.stateMutability === "nonpayable" ||
                            !item.stateMutability),
                      );
                      return (
                        writeFunctions.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "#f59e0b",
                                marginBottom: "6px",
                                fontWeight: "600",
                              }}
                            >
                              Write Functions ({writeFunctions.length})
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {writeFunctions.map((func: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setSelectedWriteFunction(func);
                                    setSelectedReadFunction(null);
                                    setFunctionInputs({});
                                    setReadFunctionResult(null);
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    background:
                                      selectedWriteFunction?.name === func.name
                                        ? "rgba(245, 158, 11, 0.3)"
                                        : "rgba(245, 158, 11, 0.15)",
                                    color: "#f59e0b",
                                    border:
                                      selectedWriteFunction?.name === func.name
                                        ? "1px solid rgba(245, 158, 11, 0.5)"
                                        : "1px solid transparent",
                                    borderRadius: "6px",
                                    fontSize: "0.8rem",
                                    fontFamily: "monospace",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (
                                      selectedWriteFunction?.name !== func.name
                                    ) {
                                      e.currentTarget.style.background =
                                        "rgba(245, 158, 11, 0.25)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (
                                      selectedWriteFunction?.name !== func.name
                                    ) {
                                      e.currentTarget.style.background =
                                        "rgba(245, 158, 11, 0.15)";
                                    }
                                  }}
                                >
                                  {func.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      );
                    })()}

                    {/* Events */}
                    {contractData.abi.filter(
                      (item: any) => item.type === "event",
                    ).length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#10b981",
                            marginBottom: "6px",
                            fontWeight: "600",
                          }}
                        >
                          Events (
                          {
                            contractData.abi.filter(
                              (item: any) => item.type === "event",
                            ).length
                          }
                          )
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {contractData.abi
                            .filter((item: any) => item.type === "event")
                            .slice(0, 10)
                            .map((event: any, idx: number) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "4px 10px",
                                  background: "rgba(139, 92, 246, 0.15)",
                                  color: "#8b5cf6",
                                  borderRadius: "6px",
                                  fontSize: "0.8rem",
                                  fontFamily: "monospace",
                                }}
                              >
                                {event.name}
                              </span>
                            ))}
                          {contractData.abi.filter(
                            (item: any) => item.type === "event",
                          ).length > 10 && (
                            <span
                              style={{
                                color: "rgba(255, 255, 255, 0.5)",
                                fontSize: "0.85rem",
                                alignSelf: "center",
                              }}
                            >
                              +
                              {contractData.abi.filter(
                                (item: any) => item.type === "event",
                              ).length - 10}{" "}
                              more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Read Function Form */}
                    {selectedReadFunction && (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "16px",
                          background: "rgba(59, 130, 246, 0.05)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "#3b82f6",
                            marginBottom: "12px",
                            fontWeight: "600",
                            fontFamily: "monospace",
                          }}
                        >
                          {selectedReadFunction.name}
                        </div>

                        {selectedReadFunction.inputs &&
                        selectedReadFunction.inputs.length > 0 ? (
                          <div style={{ marginBottom: "12px" }}>
                            {selectedReadFunction.inputs.map(
                              (input: any, idx: number) => (
                                <div key={idx} style={{ marginBottom: "10px" }}>
                                  <label
                                    style={{
                                      display: "block",
                                      fontSize: "0.8rem",
                                      color: "rgba(255, 255, 255, 0.7)",
                                      marginBottom: "4px",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {input.name || `param${idx}`} ({input.type})
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      functionInputs[
                                        input.name || `param${idx}`
                                      ] || ""
                                    }
                                    onChange={(e) =>
                                      setFunctionInputs({
                                        ...functionInputs,
                                        [input.name || `param${idx}`]:
                                          e.target.value,
                                      })
                                    }
                                    placeholder={`Enter ${input.type}`}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      background: "rgba(0, 0, 0, 0.3)",
                                      border: "1px solid rgba(59, 130, 246, 0.3)",
                                      borderRadius: "6px",
                                      color: "#fff",
                                      fontSize: "0.85rem",
                                      fontFamily: "monospace",
                                    }}
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#10b981",
                              marginBottom: "12px",
                              fontStyle: "italic",
                            }}
                          >
                            No parameters required
                          </div>
                        )}

                        {/* Read Result */}
                        {readFunctionResult !== null && (
                          <div
                            style={{
                              marginBottom: "12px",
                              padding: "10px",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              background: readFunctionResult?.startsWith("Error")
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(16, 185, 129, 0.1)",
                              border: `1px solid ${
                                readFunctionResult?.startsWith("Error")
                                  ? "rgba(239, 68, 68, 0.3)"
                                  : "rgba(16, 185, 129, 0.3)"
                              }`,
                              color: readFunctionResult?.startsWith("Error")
                                ? "#ef4444"
                                : "#10b981",
                              wordBreak: "break-all",
                              fontFamily: "monospace",
                            }}
                          >
                            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                              {readFunctionResult?.startsWith("Error") ? "❌ Error" : "✅ Result"}
                            </div>
                            {readFunctionResult}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={handleReadFunction}
                            disabled={isReadingFunction}
                            style={{
                              flex: 1,
                              padding: "10px 16px",
                              background: isReadingFunction
                                ? "rgba(59, 130, 246, 0.1)"
                                : "rgba(59, 130, 246, 0.2)",
                              color: isReadingFunction
                                ? "rgba(59, 130, 246, 0.5)"
                                : "#3b82f6",
                              border: "1px solid rgba(59, 130, 246, 0.4)",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              cursor: isReadingFunction
                                ? "not-allowed"
                                : "pointer",
                              transition: "all 0.2s",
                              opacity: isReadingFunction ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isReadingFunction) {
                                e.currentTarget.style.background =
                                  "rgba(59, 130, 246, 0.3)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isReadingFunction) {
                                e.currentTarget.style.background =
                                  "rgba(59, 130, 246, 0.2)";
                              }
                            }}
                          >
                            {isReadingFunction ? "Reading..." : "Query"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReadFunction(null);
                              setReadFunctionResult(null);
                            }}
                            style={{
                              padding: "10px 16px",
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.2)";
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Write Function Form */}
                    {selectedWriteFunction && (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "16px",
                          background: "rgba(245, 158, 11, 0.05)",
                          border: "1px solid rgba(245, 158, 11, 0.2)",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "#f59e0b",
                            marginBottom: "12px",
                            fontWeight: "600",
                            fontFamily: "monospace",
                          }}
                        >
                          {selectedWriteFunction.name}
                          {selectedWriteFunction.stateMutability ===
                            "payable" && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "0.75rem",
                                padding: "2px 6px",
                                background: "rgba(16, 185, 129, 0.15)",
                                color: "#10b981",
                                borderRadius: "4px",
                              }}
                            >
                              payable
                            </span>
                          )}
                        </div>

                        {selectedWriteFunction.inputs &&
                        selectedWriteFunction.inputs.length > 0 ? (
                          <div style={{ marginBottom: "12px" }}>
                            {selectedWriteFunction.inputs.map(
                              (input: any, idx: number) => (
                                <div key={idx} style={{ marginBottom: "10px" }}>
                                  <label
                                    style={{
                                      display: "block",
                                      fontSize: "0.8rem",
                                      color: "rgba(255, 255, 255, 0.7)",
                                      marginBottom: "4px",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {input.name || `param${idx}`} ({input.type})
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      functionInputs[
                                        input.name || `param${idx}`
                                      ] || ""
                                    }
                                    onChange={(e) =>
                                      setFunctionInputs({
                                        ...functionInputs,
                                        [input.name || `param${idx}`]:
                                          e.target.value,
                                      })
                                    }
                                    placeholder={`Enter ${input.type}`}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      background: "rgba(0, 0, 0, 0.3)",
                                      border:
                                        "1px solid rgba(245, 158, 11, 0.3)",
                                      borderRadius: "6px",
                                      color: "#fff",
                                      fontSize: "0.85rem",
                                      fontFamily: "monospace",
                                    }}
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#10b981",
                              marginBottom: "12px",
                              fontStyle: "italic",
                            }}
                          >
                            No parameters required
                          </div>
                        )}

                        {selectedWriteFunction.stateMutability ===
                          "payable" && (
                          <div style={{ marginBottom: "12px" }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "0.8rem",
                                color: "rgba(255, 255, 255, 0.7)",
                                marginBottom: "4px",
                                fontFamily: "monospace",
                              }}
                            >
                              Value (ETH)
                            </label>
                            <input
                              type="text"
                              value={functionInputs["_value"] || ""}
                              onChange={(e) =>
                                setFunctionInputs({
                                  ...functionInputs,
                                  _value: e.target.value,
                                })
                              }
                              placeholder="0.0"
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                background: "rgba(0, 0, 0, 0.3)",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                borderRadius: "6px",
                                color: "#fff",
                                fontSize: "0.85rem",
                                fontFamily: "monospace",
                              }}
                            />
                          </div>
                        )}

                        {/* Transaction Status */}
                        {(isPending ||
                          isConfirming ||
                          isConfirmed ||
                          isError) && (
                          <div
                            style={{
                              marginBottom: "12px",
                              padding: "10px",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              background: isError
                                ? "rgba(239, 68, 68, 0.1)"
                                : isConfirmed
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : "rgba(59, 130, 246, 0.1)",
                              border: `1px solid ${
                                isError
                                  ? "rgba(239, 68, 68, 0.3)"
                                  : isConfirmed
                                    ? "rgba(16, 185, 129, 0.3)"
                                    : "rgba(59, 130, 246, 0.3)"
                              }`,
                              color: isError
                                ? "#ef4444"
                                : isConfirmed
                                  ? "#10b981"
                                  : "#3b82f6",
                            }}
                          >
                            {isPending &&
                              "⏳ Waiting for wallet confirmation..."}
                            {isConfirming &&
                              "⏳ Waiting for transaction confirmation..."}
                            {isConfirmed && (
                              <div>
                                ✅ Transaction confirmed!
                                {hash && (
                                  <div
                                    style={{
                                      marginTop: "4px",
                                      fontFamily: "monospace",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    <Link
                                      to={`/${chainId}/tx/${hash}`}
                                      style={{
                                        color: "#10b981",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      View transaction
                                    </Link>
                                  </div>
                                )}
                              </div>
                            )}
                            {isError && (
                              <div>
                                ❌ Error:{" "}
                                {error?.message || "Transaction failed"}
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={handleWriteFunction}
                            disabled={isPending || isConfirming}
                            style={{
                              flex: 1,
                              padding: "10px 16px",
                              background:
                                isPending || isConfirming
                                  ? "rgba(245, 158, 11, 0.1)"
                                  : "rgba(245, 158, 11, 0.2)",
                              color:
                                isPending || isConfirming
                                  ? "rgba(245, 158, 11, 0.5)"
                                  : "#f59e0b",
                              border: "1px solid rgba(245, 158, 11, 0.4)",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              cursor:
                                isPending || isConfirming
                                  ? "not-allowed"
                                  : "pointer",
                              transition: "all 0.2s",
                              opacity: isPending || isConfirming ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isPending && !isConfirming) {
                                e.currentTarget.style.background =
                                  "rgba(245, 158, 11, 0.3)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isPending && !isConfirming) {
                                e.currentTarget.style.background =
                                  "rgba(245, 158, 11, 0.2)";
                              }
                            }}
                          >
                            {isPending
                              ? "Confirming in Wallet..."
                              : isConfirming
                                ? "Processing..."
                                : "Write"}
                          </button>
                          <button
                            onClick={() => setSelectedWriteFunction(null)}
                            style={{
                              padding: "10px 16px",
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.2)";
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Constructor */}
                    {contractData.abi.find(
                      (item: any) => item.type === "constructor",
                    ) && (
                      <div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#10b981",
                            marginBottom: "6px",
                            fontWeight: "600",
                          }}
                        >
                          Constructor
                        </div>
                        <span
                          style={{
                            padding: "4px 10px",
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "#f59e0b",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontFamily: "monospace",
                            display: "inline-block",
                          }}
                        >
                          constructor
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Info */}
              {contractData.metadata && (
                <div
                  className="block-detail-item"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <span className="detail-label">Additional Metadata</span>
                  <div
                    style={{
                      marginTop: "8px",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {contractData.metadata.language && (
                      <div
                        style={{
                          padding: "8px",
                          background: "rgba(255, 255, 255, 0.03)",
                          borderRadius: "6px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#10b981",
                            marginBottom: "4px",
                          }}
                        >
                          Language
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#10b981" }}>
                          {contractData.metadata.language}
                        </div>
                      </div>
                    )}
                    {contractData.metadata.compiler && (
                      <div
                        style={{
                          padding: "8px",
                          background: "rgba(255, 255, 255, 0.03)",
                          borderRadius: "6px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#10b981",
                            marginBottom: "4px",
                          }}
                        >
                          Compiler
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#10b981" }}>
                          {contractData.metadata.compiler.version}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sourcifyData && (
                <div
                  className="block-detail-item"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <a
                    href={`https://repo.sourcify.dev/contracts/full_match/${chainId}/${addressHash}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#10b981",
                      textDecoration: "none",
                      fontWeight: "600",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    View Full Contract on Sourcify ↗
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions Table */}
      {address.recentTransactions && address.recentTransactions.length > 0 && (
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Recent Transactions</span>
            <span
              style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.6)" }}
            >
              Last {address.recentTransactions.length} transactions
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                    }}
                  >
                    TX Hash
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                    }}
                  >
                    From
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                    }}
                  >
                    To
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                    }}
                  >
                    Value
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {address.recentTransactions.map((tx, index) => (
                  <tr
                    key={tx.hash}
                    style={{
                      borderBottom:
                        index < address.recentTransactions!.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.05)"
                          : "none",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "12px" }}>
                      <Link
                        to={`/${chainId}/tx/${tx.hash}`}
                        style={{
                          color: "#10b981",
                          textDecoration: "none",
                          fontFamily: "monospace",
                          fontSize: "0.9rem",
                        }}
                      >
                        {truncate(tx.hash, 8, 6)}
                      </Link>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Link
                        to={`/${chainId}/address/${tx.from}`}
                        style={{
                          color:
                            tx.from?.toLowerCase() === addressHash.toLowerCase()
                              ? "#f59e0b"
                              : "#10b981",
                          textDecoration: "none",
                          fontFamily: "monospace",
                          fontSize: "0.9rem",
                        }}
                      >
                        {tx.from?.toLowerCase() === addressHash.toLowerCase()
                          ? "This Address"
                          : truncate(tx.from || "", 6, 4)}
                      </Link>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {tx.to ? (
                        <Link
                          to={`/${chainId}/address/${tx.to}`}
                          style={{
                            color:
                              tx.to?.toLowerCase() === addressHash.toLowerCase()
                                ? "#f59e0b"
                                : "#10b981",
                            textDecoration: "none",
                            fontFamily: "monospace",
                            fontSize: "0.9rem",
                          }}
                        >
                          {tx.to?.toLowerCase() === addressHash.toLowerCase()
                            ? "This Address"
                            : truncate(tx.to, 6, 4)}
                        </Link>
                      ) : (
                        <span
                          style={{
                            color: "#8b5cf6",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                          }}
                        >
                          Contract Creation
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontFamily: "monospace",
                        color: "#10b981",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      {formatValue(tx.value)}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {tx.receipt?.status === "0x1" ? (
                        <span
                          style={{
                            padding: "4px 10px",
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#10b981",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                          }}
                        >
                          ✓ Success
                        </span>
                      ) : tx.receipt?.status === "0x0" ? (
                        <span
                          style={{
                            padding: "4px 10px",
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                          }}
                        >
                          ✗ Failed
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: "4px 10px",
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "#f59e0b",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                          }}
                        >
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Storage Section (for contracts) */}
      {isContract && (
        <div className="block-display-card">
          <div className="block-display-header">
            <span className="block-label">Contract Storage</span>
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Storage slot (e.g., 0x0)"
                value={storageSlot}
                onChange={(e) => setStorageSlot(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#1f2937",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                }}
              />
              <button
                onClick={handleGetStorage}
                style={{
                  padding: "10px 24px",
                  background: "#10b981",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#059669")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#10b981")
                }
              >
                Get
              </button>
            </div>
            {storageValue && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  wordBreak: "break-all",
                  color: "#10b981",
                }}
              >
                {storageValue}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressDisplay;