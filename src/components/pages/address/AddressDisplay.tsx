import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { encodeFunctionData, parseEther, toFunctionSelector } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AppContext } from "../../../context";
import { useSourcify } from "../../../hooks/useSourcify";
import type {
  ABI,
  ABIParameter,
  Address,
  AddressTransactionsResult,
  DecodedContenthash,
  ENSRecords,
  ENSReverseResult,
  EventABI,
  FunctionABI,
  RPCMetadata,
  Transaction,
} from "../../../types";
import { RPCIndicator } from "../../common/RPCIndicator";
import ENSRecordsDisplay from "./ENSRecordsDisplay";

interface AddressDisplayProps {
  address: Address;
  addressHash: string;
  networkId?: string;
  transactionsResult?: AddressTransactionsResult | null;
  transactionDetails?: Transaction[];
  loadingTxDetails?: boolean;
  metadata?: RPCMetadata;
  selectedProvider?: string | null;
  onProviderSelect?: (provider: string) => void;
  // ENS props
  ensName?: string | null;
  reverseResult?: ENSReverseResult | null;
  ensRecords?: ENSRecords | null;
  decodedContenthash?: DecodedContenthash | null;
  ensLoading?: boolean;
  isMainnet?: boolean;
}

const AddressDisplay: React.FC<AddressDisplayProps> = React.memo(
  ({
    address,
    addressHash,
    networkId = "1",
    transactionsResult,
    transactionDetails = [],
    loadingTxDetails = false,
    metadata,
    selectedProvider,
    onProviderSelect,
    ensName,
    reverseResult,
    ensRecords,
    decodedContenthash,
    ensLoading = false,
    isMainnet = true,
  }) => {
    const [storageSlot, setStorageSlot] = useState("");
    const [storageValue, setStorageValue] = useState("");
    const [showContractDetails, setShowContractDetails] = useState(false);
    const [selectedWriteFunction, setSelectedWriteFunction] = useState<FunctionABI | null>(null);
    const [selectedReadFunction, setSelectedReadFunction] = useState<FunctionABI | null>(null);
    const [functionInputs, setFunctionInputs] = useState<Record<string, string>>({});
    const [readFunctionResult, setReadFunctionResult] = useState<string | null>(null);
    const [isReadingFunction, setIsReadingFunction] = useState(false);
    const { jsonFiles, rpcUrls } = useContext(AppContext);

    // Wagmi hooks for contract interaction
    const { data: hash, writeContract, isPending, isError, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
      hash,
    });

    const isContract = useMemo(() => address.code && address.code !== "0x", [address.code]);

    // Fetch Sourcify data only if it's a contract
    const {
      data: sourcifyData,
      loading: sourcifyLoading,
      isVerified,
    } = useSourcify(Number(networkId), isContract ? addressHash : undefined, true);

    // Memoized helper functions
    const truncate = useCallback((str: string, start = 6, end = 4) => {
      if (!str) return "";
      if (str.length <= start + end) return str;
      return `${str.slice(0, start)}...${str.slice(-end)}`;
    }, []);

    const formatBalance = useCallback((balance: string) => {
      try {
        const eth = Number(balance) / 1e18;
        return `${eth.toFixed(6)} ETH`;
      } catch (_e) {
        return balance;
      }
    }, []);

    const formatValue = useCallback((value: string) => {
      try {
        const eth = Number(value) / 1e18;
        return `${eth.toFixed(6)} ETH`;
      } catch (_e) {
        return "0 ETH";
      }
    }, []);

    // Memoized formatted balance
    const _formattedBalance = useMemo(
      () => formatBalance(address.balance),
      [address.balance, formatBalance],
    );

    const handleGetStorage = useCallback(() => {
      // Check if the slot exists in the storeageAt object
      if (address.storeageAt?.[storageSlot]) {
        setStorageValue(address.storeageAt[storageSlot]);
      } else {
        setStorageValue("0x0000000000000000000000000000000000000000000000000000000000000000");
      }
    }, [address.storeageAt, storageSlot]);

    // Check if we have local artifact data for this address
    const localArtifact = jsonFiles[addressHash.toLowerCase()];

    // Parse local artifact to sourcify format if it exists - memoized
    const parsedLocalData = useMemo(() => {
      if (!localArtifact) return null;
      return {
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
        chainId: networkId,
        address: addressHash,
        verifiedAt: undefined,
      };
    }, [localArtifact, networkId, addressHash]);

    // Use local artifact data if available and sourcify is not verified, otherwise use sourcify
    const contractData = useMemo(
      () => (isVerified && sourcifyData ? sourcifyData : parsedLocalData),
      [isVerified, sourcifyData, parsedLocalData],
    );

    // Decode function name from calldata using ABI
    const decodeFunctionName = useCallback(
      (data: string | undefined): string | null => {
        if (!data || data === "0x" || data.length < 10) return null;
        if (!contractData?.abi) return null;

        const selector = data.slice(0, 10).toLowerCase();

        // Find matching function in ABI
        for (const item of contractData.abi) {
          // biome-ignore lint/suspicious/noExplicitAny: ABI item type
          const abiItem = item as any;
          if (abiItem.type !== "function") continue;

          // Calculate function selector: keccak256(name(type1,type2,...))
          const inputs = abiItem.inputs || [];
          // biome-ignore lint/suspicious/noExplicitAny: ABI input type
          const signature = `${abiItem.name}(${inputs.map((i: any) => i.type).join(",")})`;

          try {
            const computedSelector = toFunctionSelector(signature).toLowerCase();
            if (computedSelector === selector) {
              return abiItem.name;
            }
          } catch {}
        }

        return null;
      },
      [contractData?.abi],
    );

    const handleWriteFunction = useCallback(async () => {
      if (!selectedWriteFunction) return;

      try {
        // Prepare function arguments
        const args: unknown[] = [];
        if (selectedWriteFunction.inputs && selectedWriteFunction.inputs.length > 0) {
          for (const input of selectedWriteFunction.inputs) {
            const paramName = input.name || `param${selectedWriteFunction.inputs.indexOf(input)}`;
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
        const valueKey = "_value";
        if (selectedWriteFunction.stateMutability === "payable" && functionInputs[valueKey]) {
          try {
            txValue = parseEther(functionInputs[valueKey]);
          } catch (_e) {
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
    }, [selectedWriteFunction, functionInputs, addressHash, contractData?.abi, writeContract]);

    const handleReadFunction = useCallback(async () => {
      if (!selectedReadFunction || !contractData) return;

      setIsReadingFunction(true);
      setReadFunctionResult(null);

      try {
        // Get RPC URL for the current chain
        const networkIdNum = Number(networkId);
        const rpcUrlsForChain = rpcUrls[networkIdNum as keyof typeof rpcUrls];

        if (!rpcUrlsForChain) {
          throw new Error(`No RPC URL configured for chain ${networkId}`);
        }

        // Get first RPC URL (could be string or array)
        const rpcUrl = Array.isArray(rpcUrlsForChain) ? rpcUrlsForChain[0] : rpcUrlsForChain;

        if (!rpcUrl) {
          // Defensive: ensure rpcUrl is defined before calling fetch
          throw new Error(`No RPC URL configured for chain ${networkId}`);
        }

        // Prepare function arguments
        const args: unknown[] = [];
        if (selectedReadFunction.inputs && selectedReadFunction.inputs.length > 0) {
          for (const input of selectedReadFunction.inputs) {
            const paramName = input.name || `param${selectedReadFunction.inputs.indexOf(input)}`;
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
              {
                to: addressHash,
                data: encodeFunctionData({
                  abi: contractData.abi,
                  functionName: selectedReadFunction.name,
                  args: args,
                }),
              },
              "latest",
            ],
            id: 1,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || "Contract call failed");
        }

        setReadFunctionResult(data.result);
      } catch (err) {
        console.error("Error reading from contract:", err);
        setReadFunctionResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setIsReadingFunction(false);
      }
    }, [selectedReadFunction, contractData, networkId, functionInputs, addressHash, rpcUrls]);

    return (
      <div className="block-display-card">
        <div className="block-display-header address-header">
          <div>
            <span className="block-label">Address</span>
            {(ensName || reverseResult?.ensName) && (
              <span className="address-ens-name">{ensName || reverseResult?.ensName}</span>
            )}
            <span className="tx-mono header-subtitle">{addressHash}</span>
          </div>
          {metadata && selectedProvider !== undefined && onProviderSelect && (
            <RPCIndicator
              metadata={metadata}
              selectedProvider={selectedProvider}
              onProviderSelect={onProviderSelect}
            />
          )}
        </div>

        <div className="address-section-content">
          {/* Address Details Section */}
          <div className="tx-details">
            <div className="tx-section">
              <span className="tx-section-title">Address Details</span>
            </div>

            {/* Type */}
            <div className="tx-row">
              <span className="tx-label">Type:</span>
              <span className="tx-value">
                {isContract ? (
                  <span className="tx-value-highlight text-blue">📄 Contract</span>
                ) : (
                  <span className="tx-value-highlight">👤 Externally Owned Account (EOA)</span>
                )}
              </span>
            </div>

            {/* Balance */}
            <div className="tx-row">
              <span className="tx-label">Balance:</span>
              <span className="tx-value">
                <span className="tx-value-highlight">{formatBalance(address.balance)}</span>
              </span>
            </div>

            {/* Transaction Count (Nonce) */}
            <div className="tx-row">
              <span className="tx-label">Transactions:</span>
              <span className="tx-value">{Number(address.txCount).toLocaleString()} txns</span>
            </div>

            {/* Verification Status (only for contracts) */}
            {isContract && (
              <div className="tx-row">
                <span className="tx-label">Contract Verified:</span>
                <span className="tx-value">
                  {sourcifyLoading ? (
                    <span className="verification-checking">Checking Sourcify...</span>
                  ) : isVerified || parsedLocalData ? (
                    <span className="flex-align-center-gap-8">
                      <span className="tx-value-highlight">✓ Verified</span>
                      {contractData?.match && (
                        <span className="match-badge match-badge-full">
                          {contractData.match === "perfect"
                            ? parsedLocalData
                              ? "Local JSON"
                              : "Perfect Match"
                            : "Partial Match"}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="verification-not-verified">Not Verified</span>
                  )}
                </span>
              </div>
            )}

            {/* Contract Name (if verified) */}
            {isContract && contractData?.name && (
              <div className="tx-row">
                <span className="tx-label">Contract Name:</span>
                <span className="tx-value">{contractData.name}</span>
              </div>
            )}

            {/* Compiler Version (if verified) */}
            {isContract && contractData?.compilerVersion && (
              <div className="tx-row">
                <span className="tx-label">Compiler:</span>
                <span className="tx-value tx-mono">{contractData.compilerVersion}</span>
              </div>
            )}
          </div>

          {/* ENS Records Section */}
          {(ensName || reverseResult?.ensName || ensLoading) && (
            <ENSRecordsDisplay
              ensName={ensName || null}
              reverseResult={reverseResult}
              records={ensRecords}
              decodedContenthash={decodedContenthash}
              loading={ensLoading}
              isMainnet={isMainnet}
            />
          )}

          {/* Contract Verification Details */}
          {isContract && (isVerified || parsedLocalData) && contractData && (
            <div className="tx-details">
              <button
                type="button"
                className="tx-section btn-toggle-section"
                onClick={() => setShowContractDetails(!showContractDetails)}
              >
                <span className="tx-section-title">Contract Details</span>
                <span className="contract-section-toggle">{showContractDetails ? " ▼" : " ▶"}</span>
              </button>

              {showContractDetails && (
                <>
                  {contractData.name && (
                    <div className="tx-row">
                      <span className="tx-label">Contract Name</span>
                      <span className="tx-value tx-value-success">{contractData.name}</span>
                    </div>
                  )}

                  {contractData.compilerVersion && (
                    <div className="tx-row">
                      <span className="tx-label">Compiler Version</span>
                      <span className="tx-value tx-mono">{contractData.compilerVersion}</span>
                    </div>
                  )}

                  {contractData.evmVersion && (
                    <div className="tx-row">
                      <span className="tx-label">EVM Version</span>
                      <span className="tx-value">{contractData.evmVersion}</span>
                    </div>
                  )}

                  {contractData.chainId && (
                    <div className="tx-row">
                      <span className="tx-label">Chain ID</span>
                      <span className="tx-value">{contractData.chainId}</span>
                    </div>
                  )}

                  {contractData.verifiedAt && (
                    <div className="tx-row">
                      <span className="tx-label">Verified At</span>
                      <span className="tx-value">
                        {new Date(contractData.verifiedAt).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {contractData.match && (
                    <div className="tx-row">
                      <span className="tx-label">Match Type</span>
                      <span
                        className={`tx-value font-weight-600 ${contractData.match === "perfect" ? "text-success" : "text-warning"}`}
                      >
                        {contractData.match.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {contractData.metadata?.compiler && (
                    <div className="tx-row">
                      <span className="tx-label">Compiler</span>
                      <span className="tx-value tx-mono">
                        {contractData.metadata.compiler.version}
                      </span>
                    </div>
                  )}

                  {contractData.creation_match && (
                    <div className="tx-row">
                      <span className="tx-label">Creation Match</span>
                      <span
                        className={`tx-value font-weight-600 ${contractData.creation_match === "perfect" ? "text-success" : "text-warning"}`}
                      >
                        {contractData.creation_match.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {contractData.runtime_match && (
                    <div className="tx-row">
                      <span className="tx-label">Runtime Match</span>
                      <span
                        className={`tx-value font-weight-600 ${contractData.runtime_match === "perfect" ? "text-success" : "text-warning"}`}
                      >
                        {contractData.runtime_match.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Contract Bytecode */}
                  <div className="tx-row-vertical">
                    <button
                      type="button"
                      className="source-toggle-container btn-reset-block"
                      onClick={() => {
                        const elem = document.getElementById("bytecode-content");
                        const icon = document.getElementById("bytecode-icon");
                        if (elem && icon) {
                          const isHidden = elem.style.display === "none";
                          elem.style.display = isHidden ? "block" : "none";
                          icon.textContent = isHidden ? "▼" : "▶";
                        }
                      }}
                    >
                      <span className="tx-label">Contract Bytecode</span>
                      <span id="bytecode-icon" className="source-toggle-icon">
                        ▶
                      </span>
                    </button>
                    <div
                      id="bytecode-content"
                      className="tx-input-data"
                      style={{ display: "none" }}
                    >
                      <code>{address.code}</code>
                    </div>
                  </div>

                  {/* Source Code */}
                  {((contractData.files && contractData.files.length > 0) ||
                    ("sources" in contractData && contractData.sources)) &&
                    (() => {
                      // Prepare source files array - either from files or sources object
                      const sources = "sources" in contractData ? contractData.sources : undefined;
                      const sourceFiles =
                        contractData.files && contractData.files.length > 0
                          ? contractData.files
                          : sources
                            ? Object.entries(sources).map(([path, source]) => ({
                                name: path,
                                path: path,
                                content: source.content || "",
                              }))
                            : [];

                      return sourceFiles.length > 0 ? (
                        <div className="tx-row-vertical">
                          <button
                            type="button"
                            className="source-toggle-container btn-reset-block"
                            onClick={() => {
                              const elem = document.getElementById("source-code-content");
                              const icon = document.getElementById("source-code-icon");
                              if (elem && icon) {
                                const isHidden = elem.style.display === "none";
                                elem.style.display = isHidden ? "block" : "none";
                                icon.textContent = isHidden ? "▼" : "▶";
                              }
                            }}
                          >
                            <span className="tx-label">Source Code</span>
                            <span id="source-code-icon" className="source-toggle-icon">
                              ▶
                            </span>
                          </button>
                          <div
                            id="source-code-content"
                            className="margin-top-8"
                            style={{ display: "none" }}
                          >
                            {sourceFiles.map((file) => (
                              <div key={file.path} className="source-file-container">
                                <div className="source-file-header">
                                  📄 {file.name || file.path}
                                </div>
                                <pre className="source-file-code">{file.content}</pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                  {/* Raw ABI */}
                  {contractData.abi && contractData.abi.length > 0 && (
                    <div className="tx-row-vertical">
                      <button
                        type="button"
                        className="source-toggle-container btn-reset-block"
                        onClick={() => {
                          const elem = document.getElementById("raw-abi-content");
                          const icon = document.getElementById("raw-abi-icon");
                          if (elem && icon) {
                            const isHidden = elem.style.display === "none";
                            elem.style.display = isHidden ? "block" : "none";
                            icon.textContent = isHidden ? "▼" : "▶";
                          }
                        }}
                      >
                        <span className="tx-label">Raw ABI</span>
                        <span id="raw-abi-icon" className="source-toggle-icon">
                          ▶
                        </span>
                      </button>
                      <div
                        id="raw-abi-content"
                        className="tx-input-data"
                        style={{ display: "none" }}
                      >
                        <code>{JSON.stringify(contractData.abi, null, 2)}</code>
                      </div>
                    </div>
                  )}

                  {/* Contract ABI */}
                  {contractData.abi && contractData.abi.length > 0 && (
                    <div className="tx-row-vertical">
                      <div className="contract-functions-header">
                        <span className="tx-label">Functions</span>
                        <ConnectButton.Custom>
                          {({
                            account,
                            chain,
                            openAccountModal,
                            openChainModal,
                            openConnectModal,
                            authenticationStatus,
                            mounted,
                          }: Parameters<
                            Parameters<typeof ConnectButton.Custom>[0]["children"]
                          >[0]) => {
                            const ready = mounted && authenticationStatus !== "loading";
                            const connected =
                              ready &&
                              account &&
                              chain &&
                              (!authenticationStatus || authenticationStatus === "authenticated");

                            return (
                              <div
                                {...(!ready && {
                                  "aria-hidden": true,
                                  className: "wallet-hidden",
                                })}
                              >
                                {(() => {
                                  if (!connected) {
                                    return (
                                      <button
                                        onClick={openConnectModal}
                                        type="button"
                                        className="btn-connect-wallet"
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
                                        className="btn-wrong-network"
                                      >
                                        Wrong Network
                                      </button>
                                    );
                                  }

                                  return (
                                    <div className="wallet-connected-container">
                                      <button
                                        onClick={openChainModal}
                                        type="button"
                                        className="btn-chain-selector"
                                      >
                                        {chain.hasIcon && chain.iconUrl && (
                                          <img
                                            alt={chain.name ?? "Chain icon"}
                                            src={chain.iconUrl}
                                            className="chain-icon"
                                          />
                                        )}
                                        {chain.name}
                                      </button>
                                      <button
                                        onClick={openAccountModal}
                                        type="button"
                                        className="btn-account"
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
                      <div className="contract-functions-content">
                        {/* Read Functions (view/pure) */}
                        {(() => {
                          const readFunctions = contractData.abi.filter(
                            (item: ABI): item is FunctionABI =>
                              item.type === "function" &&
                              ((item as FunctionABI).stateMutability === "view" ||
                                (item as FunctionABI).stateMutability === "pure"),
                          );
                          return (
                            readFunctions.length > 0 && (
                              <div className="functions-section">
                                <div className="functions-section-title functions-section-title-read">
                                  Read Functions ({readFunctions.length})
                                </div>
                                <div className="functions-list">
                                  {readFunctions.map((func: FunctionABI) => (
                                    <button
                                      type="button"
                                      key={func.name}
                                      onClick={() => {
                                        setSelectedReadFunction(func);
                                        setSelectedWriteFunction(null);
                                        setFunctionInputs({});
                                        setReadFunctionResult(null);
                                      }}
                                      className={`btn-function btn-function-read ${selectedReadFunction?.name === func.name ? "selected" : ""}`}
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
                            (item: ABI): item is FunctionABI =>
                              item.type === "function" &&
                              ((item as FunctionABI).stateMutability === "payable" ||
                                (item as FunctionABI).stateMutability === "nonpayable" ||
                                !(item as FunctionABI).stateMutability),
                          );
                          return (
                            writeFunctions.length > 0 && (
                              <div className="functions-section">
                                <div className="functions-section-title functions-section-title-write">
                                  Write Functions ({writeFunctions.length})
                                </div>
                                <div className="functions-list">
                                  {writeFunctions.map((func: FunctionABI) => (
                                    <button
                                      type="button"
                                      key={func.name}
                                      onClick={() => {
                                        setSelectedWriteFunction(func);
                                        setSelectedReadFunction(null);
                                        setFunctionInputs({});
                                        setReadFunctionResult(null);
                                      }}
                                      className={`btn-function btn-function-write ${selectedWriteFunction?.name === func.name ? "selected" : ""}`}
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
                        {contractData.abi.filter((item: ABI) => item.type === "event").length >
                          0 && (
                          <div className="functions-section">
                            <div className="functions-section-title functions-section-title-events">
                              Events (
                              {contractData.abi.filter((item: ABI) => item.type === "event").length}
                              )
                            </div>
                            <div className="functions-list">
                              {contractData.abi
                                .filter((item: ABI): item is EventABI => item.type === "event")
                                .slice(0, 10)
                                .map((event: EventABI) => (
                                  <span key={event.name} className="event-badge">
                                    {event.name}
                                  </span>
                                ))}
                              {contractData.abi.filter((item: ABI) => item.type === "event")
                                .length > 10 && (
                                <span className="events-more">
                                  +
                                  {contractData.abi.filter((item: ABI) => item.type === "event")
                                    .length - 10}{" "}
                                  more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Read Function Form */}
                        {selectedReadFunction && (
                          <div className="function-form function-form-read">
                            <div className="function-form-title function-form-title-read">
                              {selectedReadFunction.name}
                            </div>

                            {selectedReadFunction.inputs &&
                            selectedReadFunction.inputs.length > 0 ? (
                              <div className="function-inputs">
                                {selectedReadFunction.inputs.map(
                                  (input: ABIParameter, idx: number) => (
                                    <label
                                      key={`${input.name || idx}-${input.type}`}
                                      className="function-input-label"
                                    >
                                      <span className="function-input-name">
                                        {input.name || `param${idx}`} ({input.type})
                                      </span>
                                      <input
                                        type="text"
                                        value={functionInputs[input.name || `param${idx}`] || ""}
                                        onChange={(e) =>
                                          setFunctionInputs({
                                            ...functionInputs,
                                            [input.name || `param${idx}`]: e.target.value,
                                          })
                                        }
                                        placeholder={`Enter ${input.type}`}
                                        className="function-input function-input-read"
                                      />
                                    </label>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="function-no-params">No parameters required</div>
                            )}

                            {/* Read Result */}
                            {readFunctionResult !== null && (
                              <div
                                className={`function-result ${readFunctionResult?.startsWith("Error") ? "function-result-error" : "function-result-success"}`}
                              >
                                <div className="function-result-title">
                                  {readFunctionResult?.startsWith("Error")
                                    ? "❌ Error"
                                    : "✅ Result"}
                                </div>
                                {readFunctionResult}
                              </div>
                            )}

                            <div className="function-actions">
                              <button
                                type="button"
                                onClick={handleReadFunction}
                                disabled={isReadingFunction}
                                className="btn-function-action btn-query"
                              >
                                {isReadingFunction ? "Reading..." : "Query"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReadFunction(null);
                                  setReadFunctionResult(null);
                                }}
                                className="btn-cancel"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Write Function Form */}
                        {selectedWriteFunction && (
                          <div className="function-form function-form-write">
                            <div className="function-form-title function-form-title-write">
                              {selectedWriteFunction.name}
                              {selectedWriteFunction.stateMutability === "payable" && (
                                <span className="payable-badge">payable</span>
                              )}
                            </div>

                            {selectedWriteFunction.inputs &&
                            selectedWriteFunction.inputs.length > 0 ? (
                              <div className="function-inputs">
                                {selectedWriteFunction.inputs.map(
                                  (input: ABIParameter, idx: number) => (
                                    <label
                                      key={`${input.name || idx}-${input.type}`}
                                      className="function-input-label"
                                    >
                                      <span className="function-input-name">
                                        {input.name || `param${idx}`} ({input.type})
                                      </span>
                                      <input
                                        type="text"
                                        value={functionInputs[input.name || `param${idx}`] || ""}
                                        onChange={(e) =>
                                          setFunctionInputs({
                                            ...functionInputs,
                                            [input.name || `param${idx}`]: e.target.value,
                                          })
                                        }
                                        placeholder={`Enter ${input.type}`}
                                        className="function-input function-input-write"
                                      />
                                    </label>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="function-no-params">No parameters required</div>
                            )}

                            {selectedWriteFunction.stateMutability === "payable" && (
                              <label className="function-input-label">
                                <span className="function-input-name">Value (ETH)</span>
                                <input
                                  type="text"
                                  // biome-ignore lint/complexity/useLiteralKeys: _value is a special key for ETH value
                                  value={functionInputs["_value"] || ""}
                                  onChange={(e) =>
                                    setFunctionInputs({
                                      ...functionInputs,
                                      _value: e.target.value,
                                    })
                                  }
                                  placeholder="0.0"
                                  className="function-input function-input-value"
                                />
                              </label>
                            )}

                            {/* Transaction Status */}
                            {(isPending || isConfirming || isConfirmed || isError) && (
                              <div
                                className={`tx-status-box ${isError ? "tx-status-error" : isConfirmed ? "tx-status-success" : "tx-status-pending"}`}
                              >
                                {isPending && "⏳ Waiting for wallet confirmation..."}
                                {isConfirming && "⏳ Waiting for transaction confirmation..."}
                                {isConfirmed && (
                                  <div>
                                    ✅ Transaction confirmed!
                                    {hash && (
                                      <div className="tx-hash-link">
                                        <Link to={`/${networkId}/tx/${hash}`}>
                                          View transaction
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {isError && (
                                  <div>❌ Error: {error?.message || "Transaction failed"}</div>
                                )}
                              </div>
                            )}

                            <div className="function-actions">
                              <button
                                type="button"
                                onClick={handleWriteFunction}
                                disabled={isPending || isConfirming}
                                className="btn-function-action btn-write-action"
                              >
                                {isPending
                                  ? "Confirming in Wallet..."
                                  : isConfirming
                                    ? "Processing..."
                                    : "Write"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedWriteFunction(null)}
                                className="btn-cancel"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {sourcifyData && (
                    <div className="tx-row">
                      <span className="tx-label">Sourcify</span>
                      <a
                        href={`https://repo.sourcify.dev/contracts/full_match/${networkId}/${addressHash}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sourcify-link"
                      >
                        View Full Contract on Sourcify ↗
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Last Transactions Section */}
          <div className="tx-details">
            <div className="tx-section tx-history-header">
              <span className="tx-section-title">Last Transactions</span>
              {transactionsResult && (
                <span
                  className={`tx-history-status ${transactionsResult.source === "trace_filter" ? "tx-history-status-complete" : transactionsResult.source === "logs" ? "tx-history-status-partial" : "tx-history-status-none"}`}
                >
                  {transactionsResult.source === "trace_filter" && (
                    <>
                      <span className="tx-history-dot">●</span>
                      Complete history ({transactionDetails.length} transactions)
                    </>
                  )}
                  {transactionsResult.source === "logs" && (
                    <>
                      <span className="tx-history-dot">●</span>
                      Partial (logs only) - {transactionDetails.length} transactions
                    </>
                  )}
                  {transactionsResult.source === "none" && (
                    <>
                      <span className="tx-history-dot">●</span>
                      No data available
                    </>
                  )}
                </span>
              )}
            </div>

            {/* Warning message for partial data */}
            {transactionsResult?.message && (
              <div
                className={`tx-history-message ${transactionsResult.source === "none" ? "tx-history-message-error" : "tx-history-message-warning"}`}
              >
                <span className="tx-history-message-icon">
                  {transactionsResult.source === "none" ? "⚠️" : "ℹ️"}
                </span>
                {transactionsResult.message}
              </div>
            )}

            {/* Loading state */}
            {loadingTxDetails && (
              <div className="tx-history-empty">Loading transaction details...</div>
            )}

            {/* Transaction table */}
            {!loadingTxDetails && transactionDetails.length > 0 && (
              <div className="address-table-container">
                <table className="recent-transactions-table">
                  <thead>
                    <tr>
                      <th>TX Hash</th>
                      {contractData && <th>Method</th>}
                      <th>From</th>
                      <th>To</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionDetails.map((tx) => (
                      <tr key={tx.hash}>
                        <td>
                          <Link to={`/${networkId}/tx/${tx.hash}`} className="address-table-link">
                            {truncate(tx.hash, 8, 6)}
                          </Link>
                        </td>
                        {contractData && (
                          <td>
                            {tx.to?.toLowerCase() === addressHash.toLowerCase() ? (
                              (() => {
                                const funcName = decodeFunctionName(tx.data);
                                const selector = tx.data?.slice(0, 10);
                                return funcName ? (
                                  <span className="method-badge method-badge-decoded">
                                    {funcName}
                                  </span>
                                ) : selector && selector !== "0x" ? (
                                  <span
                                    className="method-badge method-badge-selector"
                                    title={selector}
                                  >
                                    {selector}
                                  </span>
                                ) : (
                                  <span className="method-badge method-badge-transfer">
                                    Transfer
                                  </span>
                                );
                              })()
                            ) : !tx.data || tx.data === "0x" ? (
                              <span className="method-badge method-badge-transfer">Transfer</span>
                            ) : (
                              <span
                                className="method-badge method-badge-selector"
                                title={tx.data?.slice(0, 10)}
                              >
                                {tx.data?.slice(0, 10)}
                              </span>
                            )}
                          </td>
                        )}
                        <td>
                          <Link
                            to={`/${networkId}/address/${tx.from}`}
                            className="address-table-link"
                          >
                            {tx.from?.toLowerCase() === addressHash.toLowerCase()
                              ? "This Address"
                              : truncate(tx.from || "", 6, 4)}
                          </Link>
                        </td>
                        <td>
                          {tx.to ? (
                            <Link
                              to={`/${networkId}/address/${tx.to}`}
                              className={`tx-table-to-link ${tx.to?.toLowerCase() === addressHash.toLowerCase() ? "tx-table-to-link-self" : "tx-table-to-link-other"}`}
                            >
                              {tx.to?.toLowerCase() === addressHash.toLowerCase()
                                ? "This Address"
                                : truncate(tx.to, 6, 4)}
                            </Link>
                          ) : (
                            <span className="contract-creation-badge">Contract Creation</span>
                          )}
                        </td>
                        <td>
                          <span className="address-table-value">{formatValue(tx.value)}</span>
                        </td>
                        <td>
                          {tx.receipt?.status === "0x1" ? (
                            <span className="table-status-badge table-status-success">
                              ✓ Success
                            </span>
                          ) : tx.receipt?.status === "0x0" ? (
                            <span className="table-status-badge table-status-failed">✗ Failed</span>
                          ) : (
                            <span className="table-status-badge table-status-pending">
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty state */}
            {!loadingTxDetails &&
              transactionDetails.length === 0 &&
              !transactionsResult?.message && (
                <div className="tx-history-empty">No transactions found for this address</div>
              )}
          </div>

          {/* Storage Section (for contracts) */}
          {isContract && (
            <div className="block-display-card">
              <div className="block-display-header">
                <span className="block-label">Contract Storage</span>
              </div>
              <div className="tx-details">
                <div className="tx-row">
                  <span className="tx-label">Storage Slot:</span>
                  <span className="tx-value">
                    <div className="storage-input-row">
                      <input
                        type="text"
                        placeholder="e.g., 0x0"
                        value={storageSlot}
                        onChange={(e) => setStorageSlot(e.target.value)}
                        className="storage-input"
                      />
                      <button type="button" onClick={handleGetStorage} className="storage-button">
                        Get
                      </button>
                    </div>
                  </span>
                </div>
                {storageValue && (
                  <div className="tx-row">
                    <span className="tx-label">Value:</span>
                    <span className="tx-value">
                      <div className="storage-value-display">{storageValue}</div>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

AddressDisplay.displayName = "AddressDisplay";

export default AddressDisplay;
