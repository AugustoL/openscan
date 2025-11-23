import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Artifacts from "../common/HH3IgnitionTool";

const DevTools: React.FC = () => {
	const { chainId } = useParams<{ chainId?: string }>();

	// State for different tools
	const [encodedData, setEncodedData] = useState("");
	const [decodedData, setDecodedData] = useState("");
	const [ethAmount, setEthAmount] = useState("");
	const [gweiAmount, setGweiAmount] = useState("");
	const [weiAmount, setWeiAmount] = useState("");

	const [blockResult, setBlockResult] = useState<any>(null);
	const [txResult, setTxResult] = useState<any>(null);
	const [addressResult, setAddressResult] = useState<any>(null);
	const [error, setError] = useState("");

	const convertToHex = (data: string) => {
		try {
			// Try to convert various formats to hex
			if (data.startsWith("0x")) {
				setDecodedData(data);
				return;
			}

			// Convert string to hex
			const hex =
				"0x" +
				Array.from(data)
					.map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
					.join("");
			setDecodedData(hex);
		} catch (err: any) {
			setError(err.message || "Failed to convert to hex");
		}
	};

	const convertFromHex = (hexData: string) => {
		try {
			if (!hexData.startsWith("0x")) {
				setError("Invalid hex format (must start with 0x)");
				return;
			}

			const hex = hexData.slice(2);
			const str =
				hex
					.match(/.{1,2}/g)
					?.map((byte) => String.fromCharCode(parseInt(byte, 16)))
					.join("") || "";
			setDecodedData(str);
		} catch (err: any) {
			setError(err.message || "Failed to decode hex");
		}
	};

	const convertEth = (value: string, from: "eth" | "gwei" | "wei") => {
		try {
			const num = parseFloat(value);
			if (isNaN(num)) return;

			switch (from) {
				case "eth":
					setGweiAmount((num * 1e9).toString());
					setWeiAmount((num * 1e18).toString());
					break;
				case "gwei":
					setEthAmount((num / 1e9).toString());
					setWeiAmount((num * 1e9).toString());
					break;
				case "wei":
					setEthAmount((num / 1e18).toString());
					setGweiAmount((num / 1e9).toString());
					break;
			}
		} catch (err: any) {
			setError(err.message || "Failed to convert");
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const clearAll = () => {
		setBlockResult(null);
		setTxResult(null);
		setAddressResult(null);
		setError("");
	};

	return (
		<div
			className="container-wide"
			style={{
				padding: "32px 24px",
				fontFamily: "Outfit, sans-serif",
			}}
		>
			{/* Error Display */}
			{error && (
				<div
					style={{
						background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
						color: "white",
						padding: "12px 16px",
						borderRadius: "12px",
						marginBottom: "24px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "10px",
						fontWeight: "600",
						fontSize: "0.9rem",
						boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
					}}
				>
					⚠️ {error}
					<button
						onClick={() => setError("")}
						style={{
							background: "rgba(255, 255, 255, 0.2)",
							border: "none",
							color: "white",
							padding: "4px 8px",
							borderRadius: "6px",
							cursor: "pointer",
							fontWeight: "600",
						}}
					>
						✕
					</button>
				</div>
			)}

			{/* Unit Converter */}
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
				<h3
					style={{
						fontSize: "1.1rem",
						fontWeight: "700",
						color: "#10b981",
						marginBottom: "16px",
						display: "flex",
						alignItems: "center",
						gap: "8px",
					}}
				>
					💱 Unit Converter (ETH ⟷ Gwei ⟷ Wei)
				</h3>
				<div className="data-grid-3">
					<div>
						<label
							style={{
								fontSize: "0.85rem",
								fontWeight: "600",
								color: "#6b7280",
								marginBottom: "6px",
								display: "block",
							}}
						>
							ETH
						</label>
						<input
							type="text"
							placeholder="1.5"
							value={ethAmount}
							onChange={(e) => {
								setEthAmount(e.target.value);
								convertEth(e.target.value, "eth");
							}}
							style={{
								width: "100%",
								padding: "10px 12px",
								border: "2px solid rgba(16, 185, 129, 0.2)",
								borderRadius: "8px",
								fontSize: "0.85rem",
								outline: "none",
								fontFamily: "monospace",
							}}
						/>
					</div>
					<div>
						<label
							style={{
								fontSize: "0.85rem",
								fontWeight: "600",
								color: "#6b7280",
								marginBottom: "6px",
								display: "block",
							}}
						>
							Gwei
						</label>
						<input
							type="text"
							placeholder="1500000000"
							value={gweiAmount}
							onChange={(e) => {
								setGweiAmount(e.target.value);
								convertEth(e.target.value, "gwei");
							}}
							style={{
								width: "100%",
								padding: "10px 12px",
								border: "2px solid rgba(16, 185, 129, 0.2)",
								borderRadius: "8px",
								fontSize: "0.85rem",
								outline: "none",
								fontFamily: "monospace",
							}}
						/>
					</div>
					<div>
						<label
							style={{
								fontSize: "0.85rem",
								fontWeight: "600",
								color: "#6b7280",
								marginBottom: "6px",
								display: "block",
							}}
						>
							Wei
						</label>
						<input
							type="text"
							placeholder="1500000000000000000"
							value={weiAmount}
							onChange={(e) => {
								setWeiAmount(e.target.value);
								convertEth(e.target.value, "wei");
							}}
							style={{
								width: "100%",
								padding: "10px 12px",
								border: "2px solid rgba(16, 185, 129, 0.2)",
								borderRadius: "8px",
								fontSize: "0.85rem",
								outline: "none",
								fontFamily: "monospace",
							}}
						/>
					</div>
				</div>
			</div>

			{/* Hex Encoder/Decoder */}
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
				<h3
					style={{
						fontSize: "1.1rem",
						fontWeight: "700",
						color: "#10b981",
						marginBottom: "16px",
						display: "flex",
						alignItems: "center",
						gap: "8px",
					}}
				>
					🔤 Hex Encoder/Decoder
				</h3>
				<div className="flex-column" style={{ gap: "12px" }}>
					<textarea
						placeholder="Enter text or hex data"
						value={encodedData}
						onChange={(e) => setEncodedData(e.target.value)}
						style={{
							width: "100%",
							padding: "10px 12px",
							border: "2px solid rgba(16, 185, 129, 0.2)",
							borderRadius: "8px",
							fontSize: "0.85rem",
							outline: "none",
							fontFamily: "monospace",
							minHeight: "80px",
							resize: "vertical",
						}}
					/>
					<div className="flex-between" style={{ gap: "12px" }}>
						<button
							onClick={() => convertToHex(encodedData)}
							style={{
								flex: 1,
								padding: "10px",
								background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
								color: "white",
								border: "none",
								borderRadius: "8px",
								fontWeight: "600",
								fontSize: "0.9rem",
								cursor: "pointer",
							}}
						>
							Encode to Hex
						</button>
						<button
							onClick={() => convertFromHex(encodedData)}
							style={{
								flex: 1,
								padding: "10px",
								background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
								color: "white",
								border: "none",
								borderRadius: "8px",
								fontWeight: "600",
								fontSize: "0.9rem",
								cursor: "pointer",
							}}
						>
							Decode from Hex
						</button>
					</div>
					{decodedData && (
						<div
							style={{
								padding: "12px",
								background: "rgba(16, 185, 129, 0.04)",
								borderRadius: "8px",
								border: "1px solid rgba(16, 185, 129, 0.15)",
								fontFamily: "monospace",
								fontSize: "0.85rem",
								wordBreak: "break-all",
							}}
						>
							<div className="flex-between mb-small">
								<span style={{ fontWeight: "600", color: "#6b7280" }}>
									Result:
								</span>
								<button
									onClick={() => copyToClipboard(decodedData)}
									style={{
										background: "#10b981",
										color: "white",
										border: "none",
										padding: "4px 8px",
										borderRadius: "6px",
										fontSize: "0.75rem",
										cursor: "pointer",
									}}
								>
									📋 Copy
								</button>
							</div>
							{decodedData}
						</div>
					)}
				</div>
			</div>

			{/* Results Section */}
			{(blockResult || txResult || addressResult) && (
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
					<div className="flex-between mb-medium">
						<h3
							style={{
								fontSize: "1.1rem",
								fontWeight: "700",
								color: "#10b981",
								margin: 0,
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							📊 Results
						</h3>
						<button
							onClick={clearAll}
							style={{
								background: "#ef4444",
								color: "white",
								border: "none",
								padding: "6px 12px",
								borderRadius: "8px",
								fontSize: "0.85rem",
								cursor: "pointer",
								fontWeight: "600",
							}}
						>
							Clear All
						</button>
					</div>
					<pre
						style={{
							background: "rgba(16, 185, 129, 0.04)",
							padding: "16px",
							borderRadius: "10px",
							fontSize: "0.75rem",
							overflow: "auto",
							border: "1px solid rgba(16, 185, 129, 0.15)",
							color: "#1f2937",
							fontFamily: "monospace",
							lineHeight: "1.6",
							maxHeight: "500px",
						}}
					>
						{JSON.stringify(blockResult || txResult || addressResult, null, 2)}
					</pre>
				</div>
			)}

			{/* Hardhat Artifacts Section */}
			<Artifacts />
		</div>
	);
};

export default DevTools;
