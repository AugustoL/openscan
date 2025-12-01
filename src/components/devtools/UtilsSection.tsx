import type React from "react";
import { useState } from "react";
import {
  computeKeccak,
  convertEthUnits,
  type EthUnit,
  hexToString,
  stringToHex,
} from "../../utils/devtools";

type SolidityType =
  | "string"
  | "bytes"
  | "address"
  | "uint256"
  | "uint128"
  | "uint64"
  | "uint32"
  | "uint8"
  | "int256"
  | "bool"
  | "bytes32"
  | "bytes4";

const UtilsSection: React.FC = () => {
  const [showUnitConverter, setShowUnitConverter] = useState(false);
  const [showKeccakHasher, setShowKeccakHasher] = useState(false);
  const [showHexEncoder, setShowHexEncoder] = useState(false);

  // Unit converter state
  const [ethAmount, setEthAmount] = useState("");
  const [finneyAmount, setFinneyAmount] = useState("");
  const [szaboAmount, setSzaboAmount] = useState("");
  const [gweiAmount, setGweiAmount] = useState("");
  const [mweiAmount, setMweiAmount] = useState("");
  const [kweiAmount, setKweiAmount] = useState("");
  const [weiAmount, setWeiAmount] = useState("");

  // Keccak tool state
  const [keccakInput, setKeccakInput] = useState("");
  const [keccakInputType, setKeccakInputType] = useState<SolidityType>("string");
  const [keccakResults, setKeccakResults] = useState<{
    encodedBytes?: string;
    rawHash?: string;
    solidityEncodePacked?: string;
    solidityEncode?: string;
    functionSelector?: string | null;
    isFunctionSignature?: boolean;
    error?: string;
  } | null>(null);

  // Hex encoder state
  const [encodedData, setEncodedData] = useState("");
  const [decodedData, setDecodedData] = useState("");

  const convertEth = (value: string, from: EthUnit) => {
    const result = convertEthUnits(value, from);
    if (!result) return;

    // Update all fields except the source
    if (from !== "eth") setEthAmount(result.eth);
    if (from !== "finney") setFinneyAmount(result.finney);
    if (from !== "szabo") setSzaboAmount(result.szabo);
    if (from !== "gwei") setGweiAmount(result.gwei);
    if (from !== "mwei") setMweiAmount(result.mwei);
    if (from !== "kwei") setKweiAmount(result.kwei);
    if (from !== "wei") setWeiAmount(result.wei);
  };

  const handleComputeKeccak = () => {
    const results = computeKeccak(keccakInput, keccakInputType);
    setKeccakResults(results);
  };

  const convertToHex = (data: string) => {
    try {
      const result = stringToHex(data);
      setDecodedData(result);
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setDecodedData(`Error: ${err.message}`);
    }
  };

  const convertFromHex = (hexData: string) => {
    try {
      const result = hexToString(hexData);
      setDecodedData(result);
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setDecodedData(`Error: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="devtools-section">
      {/* Unit Converter */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowUnitConverter(!showUnitConverter)}
        >
          <h3 className="devtools-tool-title">⇄ Unit Converter</h3>
          <span className="devtools-section-toggle">{showUnitConverter ? "▼" : "▶"}</span>
        </div>
        {showUnitConverter && (
          <div className="unit-converter-list">
            <div className="unit-converter-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="unit-converter-label">ETH (10¹⁸)</label>
              <input
                type="text"
                placeholder="1.0"
                value={ethAmount}
                onChange={(e) => {
                  setEthAmount(e.target.value);
                  convertEth(e.target.value, "eth");
                }}
                className="devtools-input"
              />
            </div>
            <div className="unit-converter-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="unit-converter-label">Finney (10¹⁵)</label>
              <input
                type="text"
                placeholder="1000"
                value={finneyAmount}
                onChange={(e) => {
                  setFinneyAmount(e.target.value);
                  convertEth(e.target.value, "finney");
                }}
                className="devtools-input"
              />
            </div>
            <div className="unit-converter-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="unit-converter-label">Szabo (10¹²)</label>
              <input
                type="text"
                placeholder="1000000"
                value={szaboAmount}
                onChange={(e) => {
                  setSzaboAmount(e.target.value);
                  convertEth(e.target.value, "szabo");
                }}
                className="devtools-input"
              />
            </div>
            <div className="unit-converter-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="unit-converter-label">Gwei (10⁹)</label>
              <input
                type="text"
                placeholder="1000000000"
                value={gweiAmount}
                onChange={(e) => {
                  setGweiAmount(e.target.value);
                  convertEth(e.target.value, "gwei");
                }}
                className="devtools-input"
              />
            </div>
            <div className="unit-converter-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="unit-converter-label">Mwei (10⁶)</label>
              <input
                type="text"
                placeholder="1000000000000"
                value={mweiAmount}
                onChange={(e) => {
                  setMweiAmount(e.target.value);
                  convertEth(e.target.value, "mwei");
                }}
                className="devtools-input"
              />
            </div>
            <div className="unit-converter-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="unit-converter-label">Kwei (10³)</label>
              <input
                type="text"
                placeholder="1000000000000000"
                value={kweiAmount}
                onChange={(e) => {
                  setKweiAmount(e.target.value);
                  convertEth(e.target.value, "kwei");
                }}
                className="devtools-input"
              />
            </div>
            <div className="unit-converter-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="unit-converter-label">Wei (10⁰)</label>
              <input
                type="text"
                placeholder="1000000000000000000"
                value={weiAmount}
                onChange={(e) => {
                  setWeiAmount(e.target.value);
                  convertEth(e.target.value, "wei");
                }}
                className="devtools-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Keccak256 Tool */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowKeccakHasher(!showKeccakHasher)}
        >
          <h3 className="devtools-tool-title">#️⃣ Keccak256 Hasher</h3>
          <span className="devtools-section-toggle">{showKeccakHasher ? "▼" : "▶"}</span>
        </div>
        {showKeccakHasher && (
          <div className="devtools-flex-column devtools-gap-12">
            <div className="keccak-input-row">
              <select
                value={keccakInputType}
                onChange={(e) => setKeccakInputType(e.target.value as SolidityType)}
                className="devtools-select keccak-type-select"
              >
                <optgroup label="Dynamic Types">
                  <option value="string">string</option>
                  <option value="bytes">bytes</option>
                </optgroup>
                <optgroup label="Fixed Types">
                  <option value="address">address</option>
                  <option value="bool">bool</option>
                  <option value="bytes32">bytes32</option>
                  <option value="bytes4">bytes4</option>
                </optgroup>
                <optgroup label="Numeric Types">
                  <option value="uint256">uint256</option>
                  <option value="uint128">uint128</option>
                  <option value="uint64">uint64</option>
                  <option value="uint32">uint32</option>
                  <option value="uint8">uint8</option>
                  <option value="int256">int256</option>
                </optgroup>
              </select>
              <input
                type="text"
                placeholder={
                  keccakInputType === "string"
                    ? "Enter text (e.g., transfer(address,uint256))"
                    : keccakInputType === "address"
                      ? "Enter address (0x...)"
                      : keccakInputType === "bool"
                        ? "Enter true/false or 1/0"
                        : keccakInputType.startsWith("uint") || keccakInputType.startsWith("int")
                          ? "Enter number"
                          : "Enter hex value (0x...)"
                }
                value={keccakInput}
                onChange={(e) => setKeccakInput(e.target.value)}
                className="devtools-input"
              />
            </div>
            {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
            <button onClick={handleComputeKeccak} className="devtools-button">
              Hash
            </button>

            {keccakResults && !keccakResults.error && keccakResults.rawHash && (
              <div className="keccak-results">
                {keccakResults.encodedBytes && (
                  <div className="keccak-result-item">
                    <div className="keccak-result-header">
                      <span className="keccak-result-label">Encoded Bytes</span>
                      {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                      <button
                        // biome-ignore lint/style/noNonNullAssertion: <TODO>
                        onClick={() => copyToClipboard(keccakResults.encodedBytes!)}
                        className="devtools-copy-btn"
                      >
                        📋
                      </button>
                    </div>
                    <div className="keccak-result-value">{keccakResults.encodedBytes}</div>
                  </div>
                )}

                <div className="keccak-result-item">
                  <div className="keccak-result-header">
                    <span className="keccak-result-label">Keccak256 Hash</span>
                    {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                    <button
                      // biome-ignore lint/style/noNonNullAssertion: <TODO>
                      onClick={() => copyToClipboard(keccakResults.rawHash!)}
                      className="devtools-copy-btn"
                    >
                      📋
                    </button>
                  </div>
                  <div className="keccak-result-value">{keccakResults.rawHash}</div>
                </div>

                <div className="keccak-result-item">
                  <div className="keccak-result-header">
                    <span className="keccak-result-label">keccak256(abi.encodePacked(input))</span>
                    {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                    <button
                      // biome-ignore lint/style/noNonNullAssertion: <TODO>
                      onClick={() => copyToClipboard(keccakResults.solidityEncodePacked!)}
                      className="devtools-copy-btn"
                    >
                      📋
                    </button>
                  </div>
                  <div className="keccak-result-value">{keccakResults.solidityEncodePacked}</div>
                </div>

                <div className="keccak-result-item">
                  <div className="keccak-result-header">
                    <span className="keccak-result-label">keccak256(abi.encode(input))</span>
                    {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                    <button
                      // biome-ignore lint/style/noNonNullAssertion: <TODO>
                      onClick={() => copyToClipboard(keccakResults.solidityEncode!)}
                      className="devtools-copy-btn"
                    >
                      📋
                    </button>
                  </div>
                  <div className="keccak-result-value">{keccakResults.solidityEncode}</div>
                </div>

                {keccakResults.isFunctionSignature && keccakResults.functionSelector && (
                  <div className="keccak-result-item keccak-selector">
                    <div className="keccak-result-header">
                      <span className="keccak-result-label">🎯 Function Selector (bytes4)</span>
                      {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                      <button
                        // biome-ignore lint/style/noNonNullAssertion: <TODO>
                        onClick={() => copyToClipboard(keccakResults.functionSelector!)}
                        className="devtools-copy-btn"
                      >
                        📋
                      </button>
                    </div>
                    <div className="keccak-result-value keccak-selector-value">
                      {keccakResults.functionSelector}
                    </div>
                  </div>
                )}
              </div>
            )}

            {keccakResults?.error && <div className="keccak-error">⚠️ {keccakResults.error}</div>}
          </div>
        )}
      </div>

      {/* Hex Encoder/Decoder */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowHexEncoder(!showHexEncoder)}
        >
          <h3 className="devtools-tool-title">🔤 Hex Encoder/Decoder</h3>
          <span className="devtools-section-toggle">{showHexEncoder ? "▼" : "▶"}</span>
        </div>
        {showHexEncoder && (
          <div className="devtools-flex-column devtools-gap-12">
            <textarea
              placeholder="Enter text or hex data"
              value={encodedData}
              onChange={(e) => setEncodedData(e.target.value)}
              className="devtools-input hex-encoder-textarea"
            />
            <div className="hex-encoder-buttons">
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button onClick={() => convertToHex(encodedData)} className="devtools-button">
                Encode to Hex
              </button>
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button onClick={() => convertFromHex(encodedData)} className="devtools-button">
                Decode from Hex
              </button>
            </div>
            {decodedData && (
              <div className="devtools-results">
                <div className="hex-result-header">
                  <span className="hex-result-label">Result:</span>
                  {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                  <button
                    onClick={() => copyToClipboard(decodedData)}
                    className="devtools-copy-btn"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="hex-result-value">{decodedData}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UtilsSection;
