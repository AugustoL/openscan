import React, { useContext, useState } from "react";
import { AppContext } from "../../context/AppContext";
import type { RpcUrlsContextType, RPCUrls } from "../../types";

const Settings: React.FC = () => {
	const { rpcUrls, setRpcUrls } = useContext(AppContext);
	const [localRpc, setLocalRpc] = useState<Record<number, string | RPCUrls>>({
		...rpcUrls,
	});
	const [saveSuccess, setSaveSuccess] = useState(false);

	const updateField = (key: keyof RpcUrlsContextType, value: string) => {
		setLocalRpc((prev) => ({ ...prev, [key]: value }));
	};

	const save = () => {
		// Convert comma-separated strings into arrays for each chainId
		const parsed: RpcUrlsContextType = Object.keys(localRpc).reduce(
			(acc, key) => {
				const k = Number(key) as unknown as keyof RpcUrlsContextType;
				const val = (localRpc as any)[k];
				if (typeof val === "string") {
					const arr = val
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean); // Previene errores por multiples comas (,,,)
					(acc as any)[k] = arr;
				} else {
					(acc as any)[k] = val;
				}
				return acc;
			},
			{} as RpcUrlsContextType,
		);

		setRpcUrls(parsed);
		setSaveSuccess(true);
		setTimeout(() => setSaveSuccess(false), 3000);
	};

	const chainConfigs = [
		{ id: 1, name: "Ethereum Mainnet" },
		{ id: 11155111, name: "Sepolia Testnet" },
		{ id: 42161, name: "Arbitrum One" },
		{ id: 10, name: "Optimism Mainnet" },
		{ id: 31337, name: "Local Hardhat" },
	];

	return (
		<div
			className="container-wide"
			style={{
				padding: "32px 24px",
				fontFamily: "Outfit, sans-serif",
				textAlign: "center",
			}}
		>
			{/* Success Message */}
			{saveSuccess && (
				<div
					style={{
						background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
						color: "white",
						padding: "12px 16px",
						borderRadius: "12px",
						marginBottom: "24px",
						display: "flex",
						alignItems: "center",
						gap: "10px",
						fontWeight: "600",
						fontSize: "0.9rem",
						boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
						animation: "slideDown 0.3s ease",
					}}
				>
					✓ Settings saved successfully!
				</div>
			)}

			{/* RPC Configuration Section */}
			<div
				style={{
					background: "#ffffff",
					borderRadius: "16px",
					padding: "24px",
					boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
					border: "1px solid rgba(16, 185, 129, 0.1)",
					marginBottom: "24px",
				}}
			>
				<h2
					style={{
						fontSize: "1.25rem",
						fontWeight: "700",
						color: "#10b981",
						marginBottom: "8px",
						display: "flex",
						alignItems: "center",
						gap: "8px",
					}}
				>
					🔗 RPC Endpoints
				</h2>
				<p
					style={{
						fontSize: "0.85rem",
						color: "#6b7280",
						marginBottom: "24px",
					}}
				>
					Enter comma-separated RPC URLs for each network. Multiple URLs provide
					fallback support.
				</p>

				<div
					className="flex-column"
					style={{
						gap: "20px",
					}}
				>
					{chainConfigs.map((chain) => (
						<div
							key={chain.id}
							style={{
								background: "rgba(16, 185, 129, 0.02)",
								padding: "16px",
								borderRadius: "12px",
								border: "1px solid rgba(16, 185, 129, 0.15)",
								transition: "all 0.2s ease",
							}}
						>
							<label
								className="flex-column"
								style={{
									gap: "8px",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
										fontWeight: "600",
										color: "#1f2937",
										fontSize: "0.95rem",
									}}
								>
									{chain.name}
									<span
										style={{
											fontSize: "0.8rem",
											color: "#6b7280",
											fontWeight: "500",
											background: "rgba(107, 114, 128, 0.1)",
											padding: "2px 8px",
											borderRadius: "6px",
										}}
									>
										Chain ID: {chain.id}
									</span>
								</div>
								<input
									style={{
										width: "100%",
										padding: "10px 12px",
										border: "2px solid rgba(16, 185, 129, 0.2)",
										borderRadius: "8px",
										fontSize: "0.85rem",
										fontFamily: "monospace",
										color: "#1f2937",
										background: "#ffffff",
										transition: "all 0.2s ease",
										outline: "none",
									}}
									value={localRpc[chain.id]}
									onChange={(e) =>
										updateField(
											chain.id as keyof RpcUrlsContextType,
											e.target.value,
										)
									}
									placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY"
									onFocus={(e) => (e.target.style.borderColor = "#10b981")}
									onBlur={(e) =>
										(e.target.style.borderColor = "rgba(16, 185, 129, 0.2)")
									}
								/>

								{/* Help text for localhost network */}
								{chain.id === 31337 && (
									<div
										style={{
											fontSize: "0.8rem",
											color: "#6b7280",
											marginTop: "4px",
											textAlign: "left",
										}}
									>
										💡 Need to access your local network remotely?{" "}
										<a
											href="https://dashboard.ngrok.com/get-started/setup"
											target="_blank"
											rel="noopener noreferrer"
											style={{
												color: "#10b981",
												textDecoration: "none",
												fontWeight: "600",
												borderBottom: "1px solid #10b981",
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.color = "#059669")
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.color = "#10b981")
											}
										>
											Learn how to set up a tunnel with ngrok
										</a>
									</div>
								)}

								{/* Display current RPC list as tags */}
								{rpcUrls[chain.id as keyof RpcUrlsContextType] &&
									Array.isArray(
										rpcUrls[chain.id as keyof RpcUrlsContextType],
									) &&
									(rpcUrls[chain.id as keyof RpcUrlsContextType] as string[])
										.length > 0 && (
										<div
											className="flex-column"
											style={{
												gap: "6px",
												marginTop: "8px",
												alignItems: "flex-start",
											}}
										>
											<span
												style={{
													fontSize: "0.75rem",
													fontWeight: "600",
													color: "#6b7280",
													textTransform: "uppercase",
													letterSpacing: "0.5px",
												}}
											>
												Current RPCs:
											</span>
											<div
												className="flex-start"
												style={{
													flexWrap: "wrap",
													gap: "8px",
												}}
											>
												{(
													rpcUrls[
														chain.id as keyof RpcUrlsContextType
													] as string[]
												).map((url, idx) => (
													<div
														key={idx}
														style={{
															background:
																"linear-gradient(135deg, #10b981 0%, #059669 100%)",
															color: "white",
															padding: "6px 12px",
															borderRadius: "8px",
															fontSize: "0.75rem",
															fontFamily: "monospace",
															display: "flex",
															alignItems: "center",
															gap: "6px",
															boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
															maxWidth: "100%",
															overflow: "hidden",
															position: "relative",
														}}
													>
														<span
															style={{
																background: "rgba(255, 255, 255, 0.25)",
																padding: "2px 6px",
																borderRadius: "4px",
																fontWeight: "700",
																fontSize: "0.7rem",
																minWidth: "20px",
																textAlign: "center",
															}}
														>
															{idx + 1}
														</span>
														<span
															style={{
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
																flex: 1,
															}}
														>
															{url}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
							</label>
						</div>
					))}

					<button
						onClick={save}
						style={{
							padding: "12px 24px",
							background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
							color: "white",
							border: "none",
							borderRadius: "10px",
							fontWeight: "600",
							fontSize: "0.95rem",
							cursor: "pointer",
							transition: "all 0.2s ease",
							boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
							fontFamily: "Outfit, sans-serif",
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.transform = "translateY(-2px)";
							e.currentTarget.style.boxShadow =
								"0 6px 16px rgba(16, 185, 129, 0.4)";
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.transform = "translateY(0)";
							e.currentTarget.style.boxShadow =
								"0 4px 12px rgba(16, 185, 129, 0.3)";
						}}
					>
						💾 Save Configuration
					</button>
				</div>
			</div>
		</div>
	);
};

export default Settings;
