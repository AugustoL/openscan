import type React from "react";
import { useState } from "react";

const NETWORKS: Record<number, { name: string }> = {
  1: { name: "Ethereum Mainnet" },
  10: { name: "Optimism" },
  42161: { name: "Arbitrum One" },
  8453: { name: "Base" },
  137: { name: "Polygon" },
  11155111: { name: "Sepolia" },
  84532: { name: "Base Sepolia" },
};

const SOURCIFY_API = "https://sourcify.dev/server";

const ContractsSection: React.FC = () => {
  // Standard JSON Verification
  const [showStandardVerify, setShowStandardVerify] = useState(true);
  const [stdChainId, setStdChainId] = useState<number>(1);
  const [stdAddress, setStdAddress] = useState("");
  const [stdContractName, setStdContractName] = useState("");
  const [stdSources, setStdSources] = useState(
    JSON.stringify(
      {
        "MyContract.sol": {
          content:
            "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    uint256 public value;\n    \n    constructor(uint256 _value) {\n        value = _value;\n    }\n}",
        },
      },
      null,
      2,
    ),
  );
  const [stdSettings, setStdSettings] = useState(
    JSON.stringify(
      {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "paris",
      },
      null,
      2,
    ),
  );
  const [stdVerifying, setStdVerifying] = useState(false);
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  const [stdResult, setStdResult] = useState<any>(null);
  const [stdError, setStdError] = useState<string | null>(null);

  // Metadata Verification
  const [showMetadataVerify, setShowMetadataVerify] = useState(false);
  const [metaChainId, setMetaChainId] = useState<number>(1);
  const [metaAddress, setMetaAddress] = useState("");
  const [metadataJson, setMetadataJson] = useState("");
  const [metaVerifying, setMetaVerifying] = useState(false);
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  const [metaResult, setMetaResult] = useState<any>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Etherscan Import
  const [showEtherscanImport, setShowEtherscanImport] = useState(false);
  const [etherscanChainId, setEtherscanChainId] = useState<number>(1);
  const [etherscanAddress, setEtherscanAddress] = useState("");
  const [etherscanApiKey, setEtherscanApiKey] = useState("");
  const [etherscanImporting, setEtherscanImporting] = useState(false);
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  const [etherscanResult, setEtherscanResult] = useState<any>(null);
  const [etherscanError, setEtherscanError] = useState<string | null>(null);

  // Similarity Verification
  const [showSimilarityVerify, setShowSimilarityVerify] = useState(false);
  const [simChainId, setSimChainId] = useState<number>(1);
  const [simAddress, setSimAddress] = useState("");
  const [simVerifying, setSimVerifying] = useState(false);
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  const [simResult, setSimResult] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Standard JSON Verification
  const verifyStandardJson = async () => {
    setStdVerifying(true);
    setStdError(null);
    setStdResult(null);

    try {
      if (!stdAddress || !stdContractName) {
        throw new Error("Address and contract name are required");
      }

      const sources = JSON.parse(stdSources);
      const settings = JSON.parse(stdSettings);

      const response = await fetch(`${SOURCIFY_API}/v2/verify/${stdChainId}/${stdAddress}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractName: stdContractName,
          compilerVersion: "0.8.0",
          sourceFiles: sources,
          settings: settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setStdResult(data);

      // Poll for verification status if we got a verification ID
      if (data.verificationId) {
        pollVerificationStatus(data.verificationId, setStdResult, setStdError);
      }
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setStdError(err.message || String(err));
    } finally {
      setStdVerifying(false);
    }
  };

  // Metadata Verification
  const verifyMetadata = async () => {
    setMetaVerifying(true);
    setMetaError(null);
    setMetaResult(null);

    try {
      if (!metaAddress || !metadataJson) {
        throw new Error("Address and metadata JSON are required");
      }

      const metadata = JSON.parse(metadataJson);

      const response = await fetch(
        `${SOURCIFY_API}/v2/verify/metadata/${metaChainId}/${metaAddress}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metadata: metadata,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setMetaResult(data);

      if (data.verificationId) {
        pollVerificationStatus(data.verificationId, setMetaResult, setMetaError);
      }
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setMetaError(err.message || String(err));
    } finally {
      setMetaVerifying(false);
    }
  };

  // Etherscan Import
  const importFromEtherscan = async () => {
    setEtherscanImporting(true);
    setEtherscanError(null);
    setEtherscanResult(null);

    try {
      if (!etherscanAddress) {
        throw new Error("Address is required");
      }

      const url = new URL(
        `${SOURCIFY_API}/v2/verify/etherscan/${etherscanChainId}/${etherscanAddress}`,
      );
      if (etherscanApiKey) {
        url.searchParams.append("apiKey", etherscanApiKey);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setEtherscanResult(data);

      if (data.verificationId) {
        pollVerificationStatus(data.verificationId, setEtherscanResult, setEtherscanError);
      }
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setEtherscanError(err.message || String(err));
    } finally {
      setEtherscanImporting(false);
    }
  };

  // Similarity Verification
  const verifySimilarity = async () => {
    setSimVerifying(true);
    setSimError(null);
    setSimResult(null);

    try {
      if (!simAddress) {
        throw new Error("Address is required");
      }

      const response = await fetch(
        `${SOURCIFY_API}/v2/verify/similarity/${simChainId}/${simAddress}`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setSimResult(data);

      if (data.verificationId) {
        pollVerificationStatus(data.verificationId, setSimResult, setSimError);
      }
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setSimError(err.message || String(err));
    } finally {
      setSimVerifying(false);
    }
  };

  // Poll verification status
  const pollVerificationStatus = async (
    verificationId: string,
    // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    setResult: (data: any) => void,
    setError: (error: string) => void,
  ) => {
    let attempts = 0;
    const maxAttempts = 30;
    const pollInterval = 2000;

    const poll = async () => {
      try {
        const response = await fetch(`${SOURCIFY_API}/v2/verify/${verificationId}`);
        const data = await response.json();

        if (data.status === "completed" || data.status === "failed") {
          setResult(data);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setError("Verification timed out. Check status manually.");
        }
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      } catch (err: any) {
        setError(err.message || String(err));
      }
    };

    poll();
  };

  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  const renderResult = (result: any) => {
    if (!result) return null;
    return (
      <div className="devtools-results">
        <pre className="mono sourcify-result-json">{JSON.stringify(result, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="devtools-section">
      {/* Standard JSON Verification */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowStandardVerify(!showStandardVerify)}
        >
          <h3 className="devtools-tool-title">✅ Verify Contract (Standard JSON)</h3>
          <span className="devtools-section-toggle">{showStandardVerify ? "▼" : "▶"}</span>
        </div>
        {showStandardVerify && (
          <div className="devtools-flex-column devtools-gap-12">
            <div className="sourcify-grid-2col">
              <div className="devtools-flex-column devtools-gap-4">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Chain ID</label>
                <select
                  className="devtools-input"
                  value={stdChainId}
                  onChange={(e) => setStdChainId(Number(e.target.value))}
                >
                  {Object.entries(NETWORKS).map(([id, net]) => (
                    <option key={id} value={id}>
                      {net.name} ({id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="devtools-flex-column devtools-gap-4">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Contract Address</label>
                <input
                  type="text"
                  className="devtools-input mono"
                  placeholder="0x..."
                  value={stdAddress}
                  onChange={(e) => setStdAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="devtools-flex-column devtools-gap-4">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Contract Name</label>
              <input
                type="text"
                className="devtools-input"
                placeholder="MyContract"
                value={stdContractName}
                onChange={(e) => setStdContractName(e.target.value)}
              />
            </div>

            <div className="devtools-flex-column devtools-gap-4">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Sources (JSON)</label>
              <textarea
                className="devtools-input mono sourcify-sources-textarea"
                placeholder='{"MyContract.sol": {"content": "pragma solidity..."}}'
                value={stdSources}
                onChange={(e) => setStdSources(e.target.value)}
              />
            </div>

            <div className="devtools-flex-column devtools-gap-4">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Compiler Settings (JSON)</label>
              <textarea
                className="devtools-input mono sourcify-settings-textarea"
                placeholder='{"optimizer": {"enabled": true, "runs": 200}}'
                value={stdSettings}
                onChange={(e) => setStdSettings(e.target.value)}
              />
            </div>

            {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
            <button
              className="devtools-button"
              onClick={verifyStandardJson}
              disabled={stdVerifying}
            >
              {stdVerifying ? "Verifying..." : "Verify Contract"}
            </button>

            {stdError && <div className="devtools-error">{stdError}</div>}
            {stdResult && renderResult(stdResult)}
          </div>
        )}
      </div>

      {/* Metadata Verification */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowMetadataVerify(!showMetadataVerify)}
        >
          <h3 className="devtools-tool-title">🧾 Verify with Metadata</h3>
          <span className="devtools-section-toggle">{showMetadataVerify ? "▼" : "▶"}</span>
        </div>
        {showMetadataVerify && (
          <div className="devtools-flex-column devtools-gap-12">
            <div className="sourcify-grid-2col">
              <div className="devtools-flex-column devtools-gap-4">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Chain ID</label>
                <select
                  className="devtools-input"
                  value={metaChainId}
                  onChange={(e) => setMetaChainId(Number(e.target.value))}
                >
                  {Object.entries(NETWORKS).map(([id, net]) => (
                    <option key={id} value={id}>
                      {net.name} ({id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="devtools-flex-column devtools-gap-4">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Contract Address</label>
                <input
                  type="text"
                  className="devtools-input mono"
                  placeholder="0x..."
                  value={metaAddress}
                  onChange={(e) => setMetaAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="devtools-flex-column devtools-gap-4">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Metadata JSON</label>
              <textarea
                className="devtools-input mono sourcify-metadata-textarea"
                placeholder='{"compiler": {...}, "sources": {...}, ...}'
                value={metadataJson}
                onChange={(e) => setMetadataJson(e.target.value)}
              />
            </div>

            {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
            <button className="devtools-button" onClick={verifyMetadata} disabled={metaVerifying}>
              {metaVerifying ? "Verifying..." : "Verify with Metadata"}
            </button>

            {metaError && <div className="devtools-error">{metaError}</div>}
            {metaResult && renderResult(metaResult)}
          </div>
        )}
      </div>

      {/* Etherscan Import */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowEtherscanImport(!showEtherscanImport)}
        >
          <h3 className="devtools-tool-title">🔗 Import to Sourcify from Etherscan</h3>
          <span className="devtools-section-toggle">{showEtherscanImport ? "▼" : "▶"}</span>
        </div>
        {showEtherscanImport && (
          <div className="devtools-flex-column devtools-gap-12">
            <div className="sourcify-grid-2col">
              <div className="devtools-flex-column devtools-gap-4">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Chain ID</label>
                <select
                  className="devtools-input"
                  value={etherscanChainId}
                  onChange={(e) => setEtherscanChainId(Number(e.target.value))}
                >
                  {Object.entries(NETWORKS).map(([id, net]) => (
                    <option key={id} value={id}>
                      {net.name} ({id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="devtools-flex-column devtools-gap-4">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Contract Address</label>
                <input
                  type="text"
                  className="devtools-input mono"
                  placeholder="0x..."
                  value={etherscanAddress}
                  onChange={(e) => setEtherscanAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="devtools-flex-column devtools-gap-4">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Etherscan API Key (Optional)</label>
              <input
                type="text"
                className="devtools-input mono"
                placeholder="Your Etherscan API key..."
                value={etherscanApiKey}
                onChange={(e) => setEtherscanApiKey(e.target.value)}
              />
            </div>

            {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
            <button
              className="devtools-button"
              onClick={importFromEtherscan}
              disabled={etherscanImporting}
            >
              {etherscanImporting ? "Importing..." : "Import from Etherscan"}
            </button>

            {etherscanError && <div className="devtools-error">{etherscanError}</div>}
            {etherscanResult && renderResult(etherscanResult)}
          </div>
        )}
      </div>

      {/* Similarity Verification */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowSimilarityVerify(!showSimilarityVerify)}
        >
          <h3 className="devtools-tool-title">🔍 Verify via Similarity</h3>
          <span className="devtools-section-toggle">{showSimilarityVerify ? "▼" : "▶"}</span>
        </div>
        {showSimilarityVerify && (
          <div className="devtools-flex-column devtools-gap-12">
            <p className="sourcify-similarity-hint">
              This will attempt to find a similar verified contract and use it for verification.
            </p>

            <div className="sourcify-grid-2col">
              <div className="devtools-flex-column devtools-gap-4">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Chain ID</label>
                <select
                  className="devtools-input"
                  value={simChainId}
                  onChange={(e) => setSimChainId(Number(e.target.value))}
                >
                  {Object.entries(NETWORKS).map(([id, net]) => (
                    <option key={id} value={id}>
                      {net.name} ({id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="devtools-flex-column devtools-gap-4">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Contract Address</label>
                <input
                  type="text"
                  className="devtools-input mono"
                  placeholder="0x..."
                  value={simAddress}
                  onChange={(e) => setSimAddress(e.target.value)}
                />
              </div>
            </div>

            {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
            <button className="devtools-button" onClick={verifySimilarity} disabled={simVerifying}>
              {simVerifying ? "Verifying..." : "Verify via Similarity"}
            </button>

            {simError && <div className="devtools-error">{simError}</div>}
            {simResult && renderResult(simResult)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractsSection;
