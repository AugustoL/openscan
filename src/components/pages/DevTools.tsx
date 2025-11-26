import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Artifacts from "../common/HH3IgnitionTool";

type Section =
	| "transactions"
	| "signatures"
	| "contracts"
	| "utils"
	| "development";

const DevTools: React.FC = () => {
	const { chainId } = useParams<{ chainId?: string }>();

	// Active section state
	const [activeSection, setActiveSection] = useState<Section>("utils");

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
		<div className="container-wide devtools-container">
			{/* Section Tabs */}
			<div className="devtools-tabs">
				<button
					className={`devtools-tab ${activeSection === "transactions" ? "active" : ""}`}
					onClick={() => setActiveSection("transactions")}
				>
					Transactions
				</button>
				<button
					className={`devtools-tab ${activeSection === "signatures" ? "active" : ""}`}
					onClick={() => setActiveSection("signatures")}
				>
					Signatures
				</button>
				<button
					className={`devtools-tab ${activeSection === "contracts" ? "active" : ""}`}
					onClick={() => setActiveSection("contracts")}
				>
					Contracts
				</button>
				<button
					className={`devtools-tab ${activeSection === "utils" ? "active" : ""}`}
					onClick={() => setActiveSection("utils")}
				>
					Utils
				</button>
				<button
					className={`devtools-tab ${activeSection === "development" ? "active" : ""}`}
					onClick={() => setActiveSection("development")}
				>
					Development
				</button>
			</div>

			{/* Error Display */}
			{error && (
				<div className="devtools-error">
					⚠️ {error}
					<button
						onClick={() => setError("")}
						className="devtools-error-dismiss"
					>
						✕
					</button>
				</div>
			)}

			{/* Transactions Section */}
			{activeSection === "transactions" && (
				<div className="devtools-section">
					<div className="devtools-coming-soon">
						<span className="devtools-coming-soon-icon">🔄</span>
						<h3>Transaction Tools</h3>
						<p>More tools coming soon</p>
					</div>
				</div>
			)}

			{/* Signatures Section */}
			{activeSection === "signatures" && (
				<div className="devtools-section">
					<div className="devtools-coming-soon">
						<span className="devtools-coming-soon-icon">✍️</span>
						<h3>Signature Tools</h3>
						<p>More tools coming soon</p>
					</div>
				</div>
			)}

			{/* Contracts Section */}
			{activeSection === "contracts" && (
				<div className="devtools-section">
					<div className="devtools-coming-soon">
						<span className="devtools-coming-soon-icon">📄</span>
						<h3>Contract Tools</h3>
						<p>More tools coming soon</p>
					</div>
				</div>
			)}

			{/* Utils Section */}
			{activeSection === "utils" && (
				<div className="devtools-section">
					{/* Unit Converter */}
					<div className="devtools-card">
						<h3 className="devtools-tool-title">
							💱 Unit Converter (ETH ⟷ Gwei ⟷ Wei)
						</h3>
						<div className="data-grid-3">
							<div>
								<label className="devtools-input-label">ETH</label>
								<input
									type="text"
									placeholder="1.5"
									value={ethAmount}
									onChange={(e) => {
										setEthAmount(e.target.value);
										convertEth(e.target.value, "eth");
									}}
									className="devtools-input"
								/>
							</div>
							<div>
								<label className="devtools-input-label">Gwei</label>
								<input
									type="text"
									placeholder="1500000000"
									value={gweiAmount}
									onChange={(e) => {
										setGweiAmount(e.target.value);
										convertEth(e.target.value, "gwei");
									}}
									className="devtools-input"
								/>
							</div>
							<div>
								<label className="devtools-input-label">Wei</label>
								<input
									type="text"
									placeholder="1500000000000000000"
									value={weiAmount}
									onChange={(e) => {
										setWeiAmount(e.target.value);
										convertEth(e.target.value, "wei");
									}}
									className="devtools-input"
								/>
							</div>
						</div>
					</div>

					{/* Hex Encoder/Decoder */}
					<div className="devtools-card">
						<h3 className="devtools-tool-title">🔤 Hex Encoder/Decoder</h3>
						<div className="flex-column" style={{ gap: "12px" }}>
							<textarea
								placeholder="Enter text or hex data"
								value={encodedData}
								onChange={(e) => setEncodedData(e.target.value)}
								className="devtools-textarea"
							/>
							<div className="flex-between" style={{ gap: "12px" }}>
								<button
									onClick={() => convertToHex(encodedData)}
									className="devtools-btn"
								>
									Encode to Hex
								</button>
								<button
									onClick={() => convertFromHex(encodedData)}
									className="devtools-btn"
								>
									Decode from Hex
								</button>
							</div>
							{decodedData && (
								<div className="devtools-result">
									<div className="devtools-result-header">
										<span className="devtools-result-label">Result:</span>
										<button
											onClick={() => copyToClipboard(decodedData)}
											className="devtools-copy-btn"
										>
											📋 Copy
										</button>
									</div>
									<div className="devtools-result-value">{decodedData}</div>
								</div>
							)}
						</div>
					</div>

					{/* Results Section */}
					{(blockResult || txResult || addressResult) && (
						<div className="devtools-card">
							<div className="flex-between mb-medium">
								<h3 className="devtools-tool-title-inline">📊 Results</h3>
								<button onClick={clearAll} className="devtools-clear-btn">
									Clear All
								</button>
							</div>
							<pre className="devtools-results-pre">
								{JSON.stringify(
									blockResult || txResult || addressResult,
									null,
									2,
								)}
							</pre>
						</div>
					)}
				</div>
			)}

			{/* Development Section */}
			{activeSection === "development" && (
				<div className="devtools-section">
					{/* Hardhat Artifacts Section */}
					<Artifacts />
				</div>
			)}
		</div>
	);
};

export default DevTools;
