import React, { useContext, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSourcify } from "../../hooks/useSourcify";
import { Address, AddressTransactionsResult, Transaction } from "../../types";
import { AppContext } from "../../context";
import {
	useWriteContract,
	useWaitForTransactionReceipt,
	useReadContract,
} from "wagmi";
import { parseEther, encodeFunctionData } from "viem";

// @ts-ignore
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface AddressDisplayProps {
	address: Address;
	addressHash: string;
	chainId?: string;
	transactionsResult?: AddressTransactionsResult | null;
	transactionDetails?: Transaction[];
	loadingTxDetails?: boolean;
}

const AddressDisplay: React.FC<AddressDisplayProps> = React.memo(
	({
		address,
		addressHash,
		chainId = "1",
		transactionsResult,
		transactionDetails = [],
		loadingTxDetails = false,
	}) => {
		const [storageSlot, setStorageSlot] = useState("");
		const [storageValue, setStorageValue] = useState("");
		const [showContractDetails, setShowContractDetails] = useState(false);
		const [selectedWriteFunction, setSelectedWriteFunction] =
			useState<any>(null);
		const [selectedReadFunction, setSelectedReadFunction] = useState<any>(null);
		const [functionInputs, setFunctionInputs] = useState<
			Record<string, string>
		>({});
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

		const isContract = useMemo(
			() => address.code && address.code !== "0x",
			[address.code],
		);

		// Fetch Sourcify data only if it's a contract
		const {
			data: sourcifyData,
			loading: sourcifyLoading,
			isVerified,
		} = useSourcify(
			Number(chainId),
			isContract ? addressHash : undefined,
			true,
		);

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
			} catch (e) {
				return balance;
			}
		}, []);

		const formatValue = useCallback((value: string) => {
			try {
				const eth = Number(value) / 1e18;
				return `${eth.toFixed(6)} ETH`;
			} catch (e) {
				return "0 ETH";
			}
		}, []);

		// Memoized formatted balance
		const formattedBalance = useMemo(
			() => formatBalance(address.balance),
			[address.balance, formatBalance],
		);

		const handleGetStorage = useCallback(() => {
			// Check if the slot exists in the storeageAt object
			if (address.storeageAt && address.storeageAt[storageSlot]) {
				setStorageValue(address.storeageAt[storageSlot]);
			} else {
				setStorageValue(
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				);
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
				chainId: chainId,
				address: addressHash,
				verifiedAt: undefined,
			};
		}, [localArtifact, chainId, addressHash]);

		// Use local artifact data if available and sourcify is not verified, otherwise use sourcify
		const contractData = useMemo(
			() => (isVerified && sourcifyData ? sourcifyData : parsedLocalData),
			[isVerified, sourcifyData, parsedLocalData],
		);

		const handleWriteFunction = useCallback(async () => {
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
							input.name ||
							`param${selectedWriteFunction.inputs.indexOf(input)}`;
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
		}, [
			selectedWriteFunction,
			functionInputs,
			addressHash,
			contractData?.abi,
			writeContract,
		]);

		const handleReadFunction = useCallback(async () => {
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
							input.name ||
							`param${selectedReadFunction.inputs.indexOf(input)}`;
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
				setReadFunctionResult(
					`Error: ${err instanceof Error ? err.message : "Unknown error"}`,
				);
			} finally {
				setIsReadingFunction(false);
			}
		}, [
			selectedReadFunction,
			contractData,
			chainId,
			functionInputs,
			addressHash,
		]);

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
				fallback: contractData.abi.filter(
					(item: any) => item.type === "fallback",
				).length,
				receive: contractData.abi.filter((item: any) => item.type === "receive")
					.length,
				other: contractData.abi.filter(
					(item: any) =>
						![
							"function",
							"event",
							"constructor",
							"fallback",
							"receive",
						].includes(item.type),
				).length,
				allTypes: uniqueTypes,
				allFunctionNames: functionNames,
				hasTransfer: functionNames.includes("transfer"),
				hasTransferFrom: functionNames.includes("transferFrom"),
				hasApprove: functionNames.includes("approve"),
			});
		}

		return (
			<div className="block-display-card">
				<div className="block-display-header">
					<span className="block-label">Address</span>
					<span className="tx-mono header-subtitle">{addressHash}</span>
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
									<span className="tx-value-highlight text-blue">
										📄 Contract
									</span>
								) : (
									<span className="tx-value-highlight">
										👤 Externally Owned Account (EOA)
									</span>
								)}
							</span>
						</div>

						{/* Balance */}
						<div className="tx-row">
							<span className="tx-label">Balance:</span>
							<span className="tx-value">
								<span className="tx-value-highlight">
									{formatBalance(address.balance)}
								</span>
							</span>
						</div>

						{/* Transaction Count (Nonce) */}
						<div className="tx-row">
							<span className="tx-label">Transactions:</span>
							<span className="tx-value">
								{Number(address.txCount).toLocaleString()} txns
							</span>
						</div>

						{/* Verification Status (only for contracts) */}
						{isContract && (
							<>
								<div className="tx-row">
									<span className="tx-label">Contract Verified:</span>
									<span className="tx-value">
										{sourcifyLoading ? (
											<span className="verification-checking">
												Checking Sourcify...
											</span>
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
											<span className="verification-not-verified">
												Not Verified
											</span>
										)}
									</span>
								</div>
							</>
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
								<span className="tx-value tx-mono">
									{contractData.compilerVersion}
								</span>
							</div>
						)}
					</div>

					{/* Contract Verification Details */}
					{isContract && (isVerified || parsedLocalData) && contractData && (
						<div className="tx-details">
							<div
								className="tx-section cursor-pointer"
								onClick={() => setShowContractDetails(!showContractDetails)}
							>
								<span className="tx-section-title">Contract Details</span>
								<span className="contract-section-toggle">
									{showContractDetails ? " ▼" : " ▶"}
								</span>
							</div>

							{showContractDetails && (
								<>
									{contractData.name && (
										<div className="tx-row">
											<span className="tx-label">Contract Name</span>
											<span className="tx-value tx-value-success">
												{contractData.name}
											</span>
										</div>
									)}

									{contractData.compilerVersion && (
										<div className="tx-row">
											<span className="tx-label">Compiler Version</span>
											<span className="tx-value tx-mono">
												{contractData.compilerVersion}
											</span>
										</div>
									)}

									{contractData.evmVersion && (
										<div className="tx-row">
											<span className="tx-label">EVM Version</span>
											<span className="tx-value">
												{contractData.evmVersion}
											</span>
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
										<div
											className="source-toggle-container"
											onClick={() => {
												const elem =
													document.getElementById("bytecode-content");
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
										</div>
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
												<div className="tx-row-vertical">
													<div
														className="source-toggle-container"
														onClick={() => {
															const elem = document.getElementById(
																"source-code-content",
															);
															const icon =
																document.getElementById("source-code-icon");
															if (elem && icon) {
																const isHidden = elem.style.display === "none";
																elem.style.display = isHidden
																	? "block"
																	: "none";
																icon.textContent = isHidden ? "▼" : "▶";
															}
														}}
													>
														<span className="tx-label">Source Code</span>
														<span
															id="source-code-icon"
															className="source-toggle-icon"
														>
															▶
														</span>
													</div>
													<div
														id="source-code-content"
														className="margin-top-8"
														style={{ display: "none" }}
													>
														{sourceFiles.map((file: any, idx: number) => (
															<div key={idx} className="source-file-container">
																<div className="source-file-header">
																	📄 {file.name || file.path}
																</div>
																<pre className="source-file-code">
																	{file.content}
																</pre>
															</div>
														))}
													</div>
												</div>
											) : null;
										})()}

									{/* Raw ABI */}
									{contractData.abi && contractData.abi.length > 0 && (
										<div className="tx-row-vertical">
											<div
												className="source-toggle-container"
												onClick={() => {
													const elem =
														document.getElementById("raw-abi-content");
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
											</div>
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
											<div
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													marginBottom: "8px",
												}}
											>
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
																					background:
																						"rgba(16, 185, 129, 0.15)",
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
																					background:
																						"rgba(59, 130, 246, 0.15)",
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
																					background:
																						"rgba(16, 185, 129, 0.15)",
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
																	{readFunctions.map(
																		(func: any, idx: number) => (
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
																						selectedReadFunction?.name ===
																						func.name
																							? "rgba(59, 130, 246, 0.3)"
																							: "rgba(59, 130, 246, 0.15)",
																					color: "#3b82f6",
																					border:
																						selectedReadFunction?.name ===
																						func.name
																							? "1px solid rgba(59, 130, 246, 0.5)"
																							: "1px solid transparent",
																					borderRadius: "6px",
																					fontSize: "0.8rem",
																					fontFamily: "monospace",
																					cursor: "pointer",
																					transition: "all 0.2s",
																				}}
																				onMouseEnter={(e) => {
																					if (
																						selectedReadFunction?.name !==
																						func.name
																					) {
																						e.currentTarget.style.background =
																							"rgba(59, 130, 246, 0.25)";
																					}
																				}}
																				onMouseLeave={(e) => {
																					if (
																						selectedReadFunction?.name !==
																						func.name
																					) {
																						e.currentTarget.style.background =
																							"rgba(59, 130, 246, 0.15)";
																					}
																				}}
																			>
																				{func.name}
																			</button>
																		),
																	)}
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
																	{writeFunctions.map(
																		(func: any, idx: number) => (
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
																						selectedWriteFunction?.name ===
																						func.name
																							? "rgba(245, 158, 11, 0.3)"
																							: "rgba(245, 158, 11, 0.15)",
																					color: "#f59e0b",
																					border:
																						selectedWriteFunction?.name ===
																						func.name
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
																						selectedWriteFunction?.name !==
																						func.name
																					) {
																						e.currentTarget.style.background =
																							"rgba(245, 158, 11, 0.25)";
																					}
																				}}
																				onMouseLeave={(e) => {
																					if (
																						selectedWriteFunction?.name !==
																						func.name
																					) {
																						e.currentTarget.style.background =
																							"rgba(245, 158, 11, 0.15)";
																					}
																				}}
																			>
																				{func.name}
																			</button>
																		),
																	)}
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
																		<div
																			key={idx}
																			style={{ marginBottom: "10px" }}
																		>
																			<label
																				style={{
																					display: "block",
																					fontSize: "0.8rem",
																					color: "rgba(255, 255, 255, 0.7)",
																					marginBottom: "4px",
																					fontFamily: "monospace",
																				}}
																			>
																				{input.name || `param${idx}`} (
																				{input.type})
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
																						"1px solid rgba(59, 130, 246, 0.3)",
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
																	background: readFunctionResult?.startsWith(
																		"Error",
																	)
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
																<div
																	style={{
																		fontWeight: "600",
																		marginBottom: "4px",
																	}}
																>
																	{readFunctionResult?.startsWith("Error")
																		? "❌ Error"
																		: "✅ Result"}
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
																		<div
																			key={idx}
																			style={{ marginBottom: "10px" }}
																		>
																			<label
																				style={{
																					display: "block",
																					fontSize: "0.8rem",
																					color: "rgba(255, 255, 255, 0.7)",
																					marginBottom: "4px",
																					fontFamily: "monospace",
																				}}
																			>
																				{input.name || `param${idx}`} (
																				{input.type})
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
											</div>
										</div>
									)}

									{sourcifyData && (
										<div className="tx-row">
											<span className="tx-label">Sourcify</span>
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
								</>
							)}
						</div>
					)}

					{/* Last Transactions Section */}
					<div className="tx-details">
						<div
							className="tx-section"
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<span className="tx-section-title">Last Transactions</span>
							{transactionsResult && (
								<span
									style={{
										fontSize: "0.85rem",
										color: transactionsResult.isComplete
											? "#10b981"
											: "#f59e0b",
										display: "flex",
										alignItems: "center",
										gap: "6px",
									}}
								>
									{transactionsResult.source === "trace_filter" && (
										<>
											<span style={{ color: "#10b981" }}>●</span>
											Complete history ({transactionDetails.length}{" "}
											transactions)
										</>
									)}
									{transactionsResult.source === "logs" && (
										<>
											<span style={{ color: "#f59e0b" }}>●</span>
											Partial (logs only) - {transactionDetails.length}{" "}
											transactions
										</>
									)}
									{transactionsResult.source === "none" && (
										<>
											<span style={{ color: "#ef4444" }}>●</span>
											No data available
										</>
									)}
								</span>
							)}
						</div>

						{/* Warning message for partial data */}
						{transactionsResult?.message && (
							<div
								style={{
									padding: "12px 16px",
									background:
										transactionsResult.source === "none"
											? "rgba(239, 68, 68, 0.1)"
											: "rgba(245, 158, 11, 0.1)",
									borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
									fontSize: "0.85rem",
									color:
										transactionsResult.source === "none"
											? "#ef4444"
											: "#f59e0b",
									display: "flex",
									alignItems: "center",
									gap: "8px",
								}}
							>
								<span style={{ fontSize: "1rem" }}>
									{transactionsResult.source === "none" ? "⚠️" : "ℹ️"}
								</span>
								{transactionsResult.message}
							</div>
						)}

						{/* Loading state */}
						{loadingTxDetails && (
							<div className="tx-history-empty">
								Loading transaction details...
							</div>
						)}

						{/* Transaction table */}
						{!loadingTxDetails && transactionDetails.length > 0 && (
							<div className="address-table-container">
								<table className="recent-transactions-table">
									<thead>
										<tr>
											<th>TX Hash</th>
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
													<Link
														to={`/${chainId}/tx/${tx.hash}`}
														className="address-table-link"
													>
														{truncate(tx.hash, 8, 6)}
													</Link>
												</td>
												<td>
													<Link
														to={`/${chainId}/address/${tx.from}`}
														className="address-table-link"
													>
														{tx.from?.toLowerCase() ===
														addressHash.toLowerCase()
															? "This Address"
															: truncate(tx.from || "", 6, 4)}
													</Link>
												</td>
												<td>
													{tx.to ? (
														<Link
															to={`/${chainId}/address/${tx.to}`}
															style={{
																color:
																	tx.to?.toLowerCase() ===
																	addressHash.toLowerCase()
																		? "#f59e0b"
																		: "#10b981",
																textDecoration: "none",
																fontFamily: "monospace",
																fontSize: "0.9rem",
															}}
														>
															{tx.to?.toLowerCase() ===
															addressHash.toLowerCase()
																? "This Address"
																: truncate(tx.to, 6, 4)}
														</Link>
													) : (
														<span className="contract-creation-badge">
															Contract Creation
														</span>
													)}
												</td>
												<td className="table-right">
													<span className="address-table-value">
														{formatValue(tx.value)}
													</span>
												</td>
												<td className="table-center">
													{tx.receipt?.status === "0x1" ? (
														<span className="table-status-badge table-status-success">
															✓ Success
														</span>
													) : tx.receipt?.status === "0x0" ? (
														<span className="table-status-badge table-status-failed">
															✗ Failed
														</span>
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
								<div className="tx-history-empty">
									No transactions found for this address
								</div>
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
											<button
												onClick={handleGetStorage}
												className="storage-button"
											>
												Get
											</button>
										</div>
									</span>
								</div>
								{storageValue && (
									<div className="tx-row">
										<span className="tx-label">Value:</span>
										<span className="tx-value">
											<div className="storage-value-display">
												{storageValue}
											</div>
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
