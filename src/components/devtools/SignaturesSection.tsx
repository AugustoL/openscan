import {
  AbiCoder,
  getBytes,
  hashMessage,
  recoverAddress,
  Signature,
  TypedDataEncoder,
} from "ethers";
import type React from "react";
import { useState } from "react";

const SignaturesSection: React.FC = () => {
  const [showSignatureInspector, setShowSignatureInspector] = useState(false);
  const [showEIP712Tool, setShowEIP712Tool] = useState(false);

  // Signature Inspector state
  const [sigMessage, setSigMessage] = useState("");
  const [sigSignature, setSigSignature] = useState("");
  const [sigExpectedAddress] = useState("");
  const [sigResults, setSigResults] = useState<{
    format?: string;
    messageFormat?: string;
    messageHash?: string;
    recoveredAddress?: string;
    r?: string;
    s?: string;
    v?: number;
    isCompact?: boolean;
    yParity?: number;
    addressMatch?: boolean;
    error?: string;
  } | null>(null);

  // EIP-712 Tool state
  const [eip712Mode, setEip712Mode] = useState<"encode" | "decode">("encode");
  const [eip712Input, setEip712Input] = useState(
    JSON.stringify(
      {
        domain: {
          name: "MyApp",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
        },
        types: {
          Person: [
            { name: "name", type: "string" },
            { name: "wallet", type: "address" },
          ],
        },
        message: {
          name: "Alice",
          wallet: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        },
      },
      null,
      2,
    ),
  );
  const [eip712DecodeTypes, setEip712DecodeTypes] = useState(
    JSON.stringify(
      {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
      },
      null,
      2,
    ),
  );
  const [eip712DecodeData, setEip712DecodeData] = useState("");
  const [eip712Results, setEip712Results] = useState<{
    domainSeparator?: string;
    structHash?: string;
    messageHash?: string;
    encodedData?: string;
    decodedMessage?: string;
    error?: string;
  } | null>(null);

  const verifySignature = () => {
    try {
      if (!sigSignature) {
        setSigResults({ error: "Please provide a signature" });
        return;
      }

      const sig = sigSignature.trim();

      // Parse the signature
      let signature: Signature;
      let format: string;
      let isCompact = false;
      let yParity: number | undefined;

      // Detect signature format by length
      const sigBytes = getBytes(sig);

      if (sigBytes.length === 64) {
        // EIP-2098 compact signature (r || yParityAndS)
        format = "EIP-2098 Compact (64 bytes)";
        isCompact = true;
        signature = Signature.from(sig);
        yParity = signature.yParity;
      } else if (sigBytes.length === 65) {
        // Standard signature (r || s || v)
        format = "Standard (65 bytes)";
        signature = Signature.from(sig);
      } else {
        setSigResults({
          error: `Invalid signature length: ${sigBytes.length} bytes (expected 64 or 65)`,
        });
        return;
      }

      const r = signature.r;
      const s = signature.s;
      const v = signature.v;

      // Determine message hash based on input format
      let messageHash: string = "";
      let detectedMessageFormat: string;

      if (sigMessage.startsWith("0x") && sigMessage.length === 66) {
        // Already a hash
        messageHash = sigMessage;
        detectedMessageFormat = "Pre-hashed (32 bytes)";
      } else if (sigMessage.trim().startsWith("{")) {
        // Try to parse as JSON for EIP-712
        try {
          const parsed = JSON.parse(sigMessage);
          if (parsed.domain && parsed.types && parsed.message) {
            // EIP-712 typed data
            messageHash = TypedDataEncoder.hash(parsed.domain, parsed.types, parsed.message);
            detectedMessageFormat = "EIP-712 Typed Data";
          } else {
            // Not valid EIP-712, treat as string
            messageHash = hashMessage(sigMessage);
            detectedMessageFormat = "EIP-191 Personal Sign";
          }
        } catch {
          // Invalid JSON, treat as string
          messageHash = hashMessage(sigMessage);
          detectedMessageFormat = "EIP-191 Personal Sign";
        }
      } else {
        // EIP-191 personal sign (most common)
        messageHash = hashMessage(sigMessage);
        detectedMessageFormat = "EIP-191 Personal Sign";
      }

      // Recover the address
      const recoveredAddress = recoverAddress(messageHash, signature);

      // Check if it matches expected address
      let addressMatch: boolean | undefined;
      if (sigExpectedAddress) {
        addressMatch = recoveredAddress.toLowerCase() === sigExpectedAddress.toLowerCase();
      }

      setSigResults({
        format,
        // biome-ignore lint/style/noNonNullAssertion: <TODO>
        messageFormat: detectedMessageFormat!,
        messageHash,
        recoveredAddress,
        r,
        s,
        v,
        isCompact,
        yParity,
        addressMatch,
      });
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setSigResults({ error: err.message || "Failed to verify signature" });
    }
  };

  const encodeEIP712 = () => {
    try {
      const parsed = JSON.parse(eip712Input);
      const { domain, types, message } = parsed;

      if (!domain || !types || !message) {
        setEip712Results({ error: "JSON must contain domain, types, and message fields" });
        return;
      }

      // Get the primary type (first key in types that isn't EIP712Domain)
      const primaryType = Object.keys(types).find((t) => t !== "EIP712Domain");
      if (!primaryType) {
        setEip712Results({ error: "No primary type found in types" });
        return;
      }

      // Calculate domain separator
      const domainSeparator = TypedDataEncoder.hashDomain(domain);

      // Calculate struct hash of the message
      const structHash = TypedDataEncoder.from(types).hash(message);

      // Calculate the final message hash (what gets signed)
      const messageHash = TypedDataEncoder.hash(domain, types, message);

      // Get the encoded data
      const encodedData = TypedDataEncoder.from(types).encodeData(primaryType, message);

      setEip712Results({
        domainSeparator,
        structHash,
        messageHash,
        encodedData,
      });
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setEip712Results({ error: err.message || "Failed to encode EIP-712 data" });
    }
  };

  const decodeEIP712 = () => {
    try {
      const types = JSON.parse(eip712DecodeTypes);
      const data = eip712DecodeData.trim();

      if (!data.startsWith("0x")) {
        setEip712Results({ error: "Encoded data must be a hex string starting with 0x" });
        return;
      }

      // Get the primary type
      const primaryType = Object.keys(types).find((t) => t !== "EIP712Domain");
      if (!primaryType) {
        setEip712Results({ error: "No primary type found in types" });
        return;
      }

      // Build ABI types array from the EIP-712 types
      const typeFields = types[primaryType];
      const abiTypes: string[] = ["bytes32"]; // First 32 bytes is the type hash
      for (const field of typeFields) {
        // Map EIP-712 types to ABI types
        let abiType = field.type;
        if (abiType === "string" || abiType === "bytes") {
          abiType = "bytes32"; // Strings and bytes are hashed
        } else if (types[abiType]) {
          abiType = "bytes32"; // Nested structs are hashed
        }
        abiTypes.push(abiType);
      }

      // Decode the data
      const abiCoder = AbiCoder.defaultAbiCoder();
      const decoded = abiCoder.decode(abiTypes, data);

      // Build the decoded message object
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      const decodedMessage: Record<string, any> = {};
      decodedMessage._typeHash = decoded[0]; // First value is the type hash

      for (let i = 0; i < typeFields.length; i++) {
        const field = typeFields[i];
        let value = decoded[i + 1];

        // Convert BigInt to string for display
        if (typeof value === "bigint") {
          value = value.toString();
        }

        // Note if value is a hash (for string/bytes/struct types)
        if (field.type === "string" || field.type === "bytes" || types[field.type]) {
          decodedMessage[field.name] = `${value} (hashed ${field.type})`;
        } else {
          decodedMessage[field.name] = value;
        }
      }

      setEip712Results({
        decodedMessage: JSON.stringify(decodedMessage, null, 2),
      });
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setEip712Results({ error: err.message || "Failed to decode EIP-712 data" });
    }
  };

  return (
    <div className="devtools-section">
      {/* Signature Inspector */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowSignatureInspector(!showSignatureInspector)}
        >
          <h3 className="devtools-tool-title">🔍 Signature Inspector</h3>
          <span className="devtools-section-toggle">{showSignatureInspector ? "▼" : "▶"}</span>
        </div>
        {showSignatureInspector && (
          <div className="devtools-flex-column devtools-gap-12">
            <div className="devtools-flex-column devtools-gap-4">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Message (string, hex hash, or EIP-712 JSON)</label>
              <textarea
                placeholder='Hello World, 0x1234...abcd, or {"domain":...}'
                value={sigMessage}
                onChange={(e) => setSigMessage(e.target.value)}
                className="devtools-input sig-message-textarea"
              />
            </div>
            <div className="devtools-flex-column devtools-gap-4">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Signature (65 or 64 bytes hex)</label>
              <input
                type="text"
                placeholder="0x..."
                value={sigSignature}
                onChange={(e) => setSigSignature(e.target.value)}
                className="devtools-input"
              />
            </div>
            {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
            <button onClick={verifySignature} className="devtools-button">
              Verify Signature
            </button>

            {sigResults && (
              <div className="devtools-results">
                {sigResults.error ? (
                  <div className="devtools-error">{sigResults.error}</div>
                ) : (
                  <div className="signature-results">
                    <div className="sig-result-row">
                      <span className="sig-result-label">Signature Format:</span>
                      <span className="sig-result-value">{sigResults.format}</span>
                    </div>
                    <div className="sig-result-row">
                      <span className="sig-result-label">Message Format:</span>
                      <span className="sig-result-value">{sigResults.messageFormat}</span>
                    </div>
                    <div className="sig-result-row">
                      <span className="sig-result-label">Message Hash:</span>
                      <span className="sig-result-value mono">{sigResults.messageHash}</span>
                    </div>
                    <div className="sig-result-row">
                      <span className="sig-result-label">Recovered Address:</span>
                      <span className="sig-result-value mono">{sigResults.recoveredAddress}</span>
                    </div>
                    <div className="sig-components">
                      <div className="sig-component-title">Signature Components</div>
                      <div className="sig-result-row">
                        <span className="sig-result-label">r:</span>
                        <span className="sig-result-value mono">{sigResults.r}</span>
                      </div>
                      <div className="sig-result-row">
                        <span className="sig-result-label">s:</span>
                        <span className="sig-result-value mono">{sigResults.s}</span>
                      </div>
                      <div className="sig-result-row">
                        <span className="sig-result-label">v:</span>
                        <span className="sig-result-value">{sigResults.v}</span>
                      </div>
                      {sigResults.isCompact && sigResults.yParity !== undefined && (
                        <div className="sig-result-row">
                          <span className="sig-result-label">yParity:</span>
                          <span className="sig-result-value">{sigResults.yParity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* EIP-712 Encoder/Decoder */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowEIP712Tool(!showEIP712Tool)}
        >
          <h3 className="devtools-tool-title">📋 EIP-712 Encoder/Decoder</h3>
          <span className="devtools-section-toggle">{showEIP712Tool ? "▼" : "▶"}</span>
        </div>
        {showEIP712Tool && (
          <div className="devtools-flex-column devtools-gap-12">
            {/* Mode Toggle */}
            <div className="keccak-mode-toggle">
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                className={`keccak-mode-btn ${eip712Mode === "encode" ? "active" : ""}`}
                onClick={() => {
                  setEip712Mode("encode");
                  setEip712Results(null);
                }}
              >
                Encode
              </button>
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                className={`keccak-mode-btn ${eip712Mode === "decode" ? "active" : ""}`}
                onClick={() => {
                  setEip712Mode("decode");
                  setEip712Results(null);
                }}
              >
                Decode
              </button>
            </div>

            {eip712Mode === "encode" ? (
              <>
                <div className="devtools-flex-column devtools-gap-4">
                  {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                  <label className="input-label">EIP-712 JSON (domain, types, message)</label>
                  <textarea
                    placeholder='{"domain": {...}, "types": {...}, "message": {...}}'
                    value={eip712Input}
                    onChange={(e) => setEip712Input(e.target.value)}
                    className="devtools-input mono eip712-input-textarea"
                  />
                </div>
                {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                <button onClick={encodeEIP712} className="devtools-button">
                  Encode EIP-712
                </button>
              </>
            ) : (
              <>
                <div className="devtools-flex-column devtools-gap-4">
                  {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                  <label className="input-label">Types Definition</label>
                  <textarea
                    placeholder='{"Person": [{"name": "name", "type": "string"}]}'
                    value={eip712DecodeTypes}
                    onChange={(e) => setEip712DecodeTypes(e.target.value)}
                    className="devtools-input mono eip712-types-textarea"
                  />
                </div>
                <div className="devtools-flex-column devtools-gap-4">
                  {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                  <label className="input-label">Encoded Data (hex)</label>
                  <textarea
                    placeholder="0x..."
                    value={eip712DecodeData}
                    onChange={(e) => setEip712DecodeData(e.target.value)}
                    className="devtools-input mono eip712-data-textarea"
                  />
                </div>
                {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                <button onClick={decodeEIP712} className="devtools-button">
                  Decode EIP-712
                </button>
              </>
            )}

            {eip712Results && (
              <div className="devtools-results">
                {eip712Results.error ? (
                  <div className="devtools-error">{eip712Results.error}</div>
                ) : eip712Mode === "encode" ? (
                  <div className="eip712-results">
                    <div className="sig-result-row">
                      <span className="sig-result-label">Domain Separator:</span>
                      <span className="sig-result-value mono">{eip712Results.domainSeparator}</span>
                    </div>
                    <div className="sig-result-row">
                      <span className="sig-result-label">Struct Hash:</span>
                      <span className="sig-result-value mono">{eip712Results.structHash}</span>
                    </div>
                    <div className="sig-result-row">
                      <span className="sig-result-label">Message Hash (signable):</span>
                      <span className="sig-result-value mono">{eip712Results.messageHash}</span>
                    </div>
                    <div className="sig-result-row">
                      <span className="sig-result-label">Encoded Data:</span>
                      <span className="sig-result-value mono eip712-encoded-data">
                        {eip712Results.encodedData}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="eip712-results">
                    <div className="eip712-decoded-row">
                      <span className="sig-result-label">Decoded Message:</span>
                      <pre className="eip712-decoded-pre">{eip712Results.decodedMessage}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignaturesSection;
