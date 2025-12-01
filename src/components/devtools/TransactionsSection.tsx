import {
  BrowserProvider,
  formatEther,
  formatUnits,
  JsonRpcProvider,
  parseEther,
  parseUnits,
  type TransactionRequest,
  type TransactionResponse,
  Wallet,
} from "ethers";
import type React from "react";
import { useEffect, useState } from "react";

const NETWORKS: Record<number, { name: string; rpc: string }> = {
  1: { name: "Ethereum Mainnet", rpc: "https://eth.llamarpc.com" },
  10: { name: "Optimism", rpc: "https://mainnet.optimism.io" },
  42161: { name: "Arbitrum One", rpc: "https://arb1.arbitrum.io/rpc" },
  8453: { name: "Base", rpc: "https://mainnet.base.org" },
  137: { name: "Polygon", rpc: "https://polygon-rpc.com" },
};

const TransactionsSection: React.FC = () => {
  const [showTransactionBuilder, setShowTransactionBuilder] = useState(true);
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");
  const [txValue, setTxValue] = useState("");
  const [txData, setTxData] = useState("");
  const [txGasLimit, setTxGasLimit] = useState<string | undefined>(undefined);
  const [txGasPrice, setTxGasPrice] = useState<string | undefined>(undefined);
  const [txMaxFeePerGas, setTxMaxFeePerGas] = useState<string | undefined>(undefined);
  const [txMaxPriorityFeePerGas, setTxMaxPriorityFeePerGas] = useState<string | undefined>(
    undefined,
  );
  const [txNonce, setTxNonce] = useState<number | undefined>(undefined);
  const [txChainId, setTxChainId] = useState<number | undefined>(undefined);
  const [txType, setTxType] = useState<0 | 2>(2);
  const [useMetaMask, setUseMetaMask] = useState(true);
  const [localPrivateKey, setLocalPrivateKey] = useState("");
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
  const [suggestedFees, setSuggestedFees] = useState<any>(null);
  const [ethUsdPrice, setEthUsdPrice] = useState<number | null>(null);
  const [estimatedCostEth, setEstimatedCostEth] = useState<string | null>(null);
  const [estimatedCostUsd, setEstimatedCostUsd] = useState<string | null>(null);
  const [txSending, setTxSending] = useState(false);
  const [txHashResult, setTxHashResult] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [txWillRevert, setTxWillRevert] = useState<boolean>(false);
  const [revertReason, setRevertReason] = useState<string | null>(null);
  const [builtTx, setBuiltTx] = useState<string | null>(null);
  const [showAdvancedRaw, setShowAdvancedRaw] = useState(false);
  const [rawRlp, setRawRlp] = useState("");

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
        );
        const json = await res.json();
        const price = json?.ethereum?.usd;
        if (price) setEthUsdPrice(price);
      } catch (_err) {
        // ignore
      }
    };
    fetchEthPrice();
  }, []);

  const parseEtherSafe = (v?: string): bigint => {
    if (!v) return BigInt(0);
    try {
      return parseEther(v);
    } catch {
      return BigInt(0);
    }
  };

  const formatEthValue = (bn: bigint) => formatEther(bn);

  const estimateGasAndFees = async () => {
    setTxError(null);
    setTxWillRevert(false);
    setRevertReason(null);
    try {
      const chainId = txChainId || 1;
      const net = NETWORKS[chainId];
      if (!net) throw new Error("Unknown network - select a supported chainId");
      const provider = new JsonRpcProvider(net.rpc);

      const to = txTo || undefined;
      const value = parseEtherSafe(txValue);
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      const txReq: any = { to, value, data: txData || undefined };

      let gas: bigint;
      let willRevert = false;
      let revertMsg: string | null = null;

      try {
        await provider.call(txReq);
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      } catch (callErr: any) {
        willRevert = true;
        const errMsg = callErr.message || String(callErr);
        if (callErr.data) {
          revertMsg = `Revert data: ${callErr.data}`;
        } else if (errMsg.includes("revert")) {
          revertMsg = errMsg;
        } else if (errMsg.includes("execution reverted")) {
          revertMsg = errMsg;
        } else {
          revertMsg = `Transaction will fail: ${errMsg}`;
        }
      }

      try {
        gas = await provider.estimateGas(txReq);
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      } catch (estErr: any) {
        gas = BigInt(500000);
        if (!willRevert) {
          willRevert = true;
          revertMsg = estErr.message || "Gas estimation failed - transaction may revert";
        }
      }

      setEstimatedGas(gas.toString());
      setTxWillRevert(willRevert);
      setRevertReason(revertMsg);

      const feeData = await provider.getFeeData();
      setSuggestedFees(feeData);

      const gasPriceBN =
        txType === 0 ? (feeData.gasPrice ?? BigInt(0)) : (feeData.maxFeePerGas ?? BigInt(0));
      const cost = gas * gasPriceBN;
      setEstimatedCostEth(formatEthValue(cost));
      if (ethUsdPrice)
        setEstimatedCostUsd((parseFloat(formatEthValue(cost)) * ethUsdPrice).toFixed(6));
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setTxError(err.message || String(err));
    }
  };

  const fetchNonceForAddress = async (address: string, chainId?: number) => {
    try {
      const cid = chainId || txChainId || 1;
      const net = NETWORKS[cid];
      if (!net) throw new Error("Unknown network");
      const provider = new JsonRpcProvider(net.rpc);
      const n = await provider.getTransactionCount(address);
      setTxNonce(n);
      return n;
    } catch (_err) {
      return undefined;
    }
  };

  const sendTransaction = async () => {
    setTxError(null);
    setTxHashResult(null);
    setTxSending(true);
    try {
      const chainId = txChainId || 1;
      const net = NETWORKS[chainId];
      if (!net) throw new Error("Unknown network");
      const provider = new JsonRpcProvider(net.rpc);

      // Validate gasLimit is a valid number
      let gasLimit: bigint | undefined;
      if (txGasLimit) {
        if (!/^\d+$/.test(txGasLimit.trim())) {
          throw new Error("Gas limit must be a valid number");
        }
        gasLimit = BigInt(txGasLimit.trim());
      } else if (estimatedGas) {
        gasLimit = BigInt(estimatedGas);
      }

      const txRequest: TransactionRequest = {
        to: txTo || undefined,
        value: parseEtherSafe(txValue),
        data: txData || undefined,
        gasLimit,
      };

      if (txType === 2) {
        if (txMaxFeePerGas) txRequest.maxFeePerGas = parseUnits(txMaxFeePerGas, "gwei");
        if (txMaxPriorityFeePerGas)
          txRequest.maxPriorityFeePerGas = parseUnits(txMaxPriorityFeePerGas, "gwei");
      } else {
        if (txGasPrice) txRequest.gasPrice = parseUnits(txGasPrice, "gwei");
      }

      if (typeof txNonce === "number") txRequest.nonce = txNonce;
      txRequest.chainId = BigInt(chainId);

      let sentTx: TransactionResponse;

      if (!useMetaMask && localPrivateKey) {
        const wallet = new Wallet(localPrivateKey, provider);
        sentTx = await wallet.sendTransaction(txRequest);
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
        if (!(window as any).ethereum)
          throw new Error("No injected wallet (window.ethereum) found");
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
        const web3Provider = new BrowserProvider((window as any).ethereum as any);
        const signer = await web3Provider.getSigner();
        sentTx = await signer.sendTransaction(txRequest);
      }

      setTxHashResult(sentTx.hash);
      setTxSending(false);
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setTxError(err.message || String(err));
      setTxSending(false);
    }
  };

  const buildTransaction = () => {
    setTxError(null);
    setBuiltTx(null);
    try {
      const chainId = txChainId || 1;
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      const txObj: Record<string, any> = {
        type: txType,
        chainId: chainId,
        to: txTo || null,
        value: txValue ? parseEtherSafe(txValue).toString() : "0",
        data: txData || "0x",
        gasLimit: txGasLimit || estimatedGas || null,
      };

      if (txFrom) txObj.from = txFrom;
      if (typeof txNonce === "number") txObj.nonce = txNonce;

      if (txType === 2) {
        txObj.maxFeePerGas = txMaxFeePerGas ? parseUnits(txMaxFeePerGas, "gwei").toString() : null;
        txObj.maxPriorityFeePerGas = txMaxPriorityFeePerGas
          ? parseUnits(txMaxPriorityFeePerGas, "gwei").toString()
          : null;
      } else {
        txObj.gasPrice = txGasPrice ? parseUnits(txGasPrice, "gwei").toString() : null;
      }

      setBuiltTx(JSON.stringify(txObj, null, 2));
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setTxError(err.message || String(err));
    }
  };

  const sendRawRlpTx = async () => {
    setTxSending(true);
    setTxError(null);
    try {
      const chainId = txChainId || 1;
      const net = NETWORKS[chainId];
      if (!net) throw new Error("Unknown network");
      const provider = new JsonRpcProvider(net.rpc);
      const res = await provider.broadcastTransaction(rawRlp);
      setTxHashResult(res.hash);
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
    } catch (err: any) {
      setTxError(err.message || String(err));
    } finally {
      setTxSending(false);
    }
  };

  return (
    <div className="devtools-section">
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowTransactionBuilder(!showTransactionBuilder)}
        >
          <h3 className="devtools-tool-title">🧾 Transaction Builder</h3>
          <span className="devtools-section-toggle">{showTransactionBuilder ? "▼" : "▶"}</span>
        </div>
        {showTransactionBuilder && (
          <div className="devtools-flex-column devtools-gap-10">
            <div className="tx-builder-network-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Network</label>
              <select
                value={txChainId ?? 1}
                onChange={(e) => setTxChainId(parseInt(e.target.value, 10))}
                className="devtools-input"
              >
                <option value={1}>Ethereum Mainnet (1)</option>
                <option value={10}>Optimism (10)</option>
                <option value={42161}>Arbitrum One (42161)</option>
                <option value={8453}>Base (8453)</option>
                <option value={137}>Polygon (137)</option>
              </select>
            </div>

            <div className="tx-builder-address-row">
              <div className="devtools-flex-1">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">From (address, optional)</label>
                <input
                  type="text"
                  className="devtools-input"
                  value={txFrom}
                  onChange={(e) => setTxFrom(e.target.value)}
                  placeholder="0x... (for building unsigned tx)"
                />
              </div>
              <div className="devtools-flex-1">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">To (address)</label>
                <input
                  type="text"
                  className="devtools-input"
                  value={txTo}
                  onChange={(e) => setTxTo(e.target.value)}
                  placeholder="0x..."
                />
              </div>
            </div>

            <div className="tx-builder-value-row">
              <div className="devtools-flex-1">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Value (ETH)</label>
                <input
                  type="text"
                  className="devtools-input"
                  value={txValue}
                  onChange={(e) => setTxValue(e.target.value)}
                  placeholder="0.01"
                />
              </div>
              <div className="devtools-width-220">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Nonce (optional)</label>
                <input
                  type="number"
                  className="devtools-input"
                  value={txNonce ?? ""}
                  onChange={(e) =>
                    setTxNonce(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                  }
                  placeholder="auto"
                />
              </div>
            </div>

            <div className="devtools-flex-column">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Data (hex, optional)</label>
              <textarea
                className="devtools-input mono tx-builder-data-textarea"
                value={txData}
                onChange={(e) => setTxData(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="tx-builder-gas-row">
              <div>
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Tx Type</label>
                <select
                  className="devtools-input"
                  value={txType}
                  onChange={(e) => setTxType(Number(e.target.value) as 0 | 2)}
                >
                  <option value={2}>EIP-1559 (type 2)</option>
                  <option value={0}>Legacy (type 0)</option>
                </select>
              </div>
              <div className="devtools-flex-1">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                <label className="input-label">Gas Limit (optional)</label>
                <input
                  className="devtools-input"
                  value={txGasLimit ?? ""}
                  onChange={(e) =>
                    setTxGasLimit(e.target.value === "" ? undefined : e.target.value)
                  }
                  placeholder="auto-estimate"
                />
              </div>
            </div>

            {txType === 0 ? (
              <div className="tx-builder-fee-row">
                <div className="devtools-flex-1">
                  {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                  <label className="input-label">Gas Price (gwei)</label>
                  <input
                    className="devtools-input"
                    value={txGasPrice ?? ""}
                    onChange={(e) =>
                      setTxGasPrice(e.target.value === "" ? undefined : e.target.value)
                    }
                    placeholder="suggested"
                  />
                </div>
              </div>
            ) : (
              <div className="tx-builder-fee-row">
                <div className="devtools-flex-1">
                  {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                  <label className="input-label">Max Fee Per Gas (gwei)</label>
                  <input
                    className="devtools-input"
                    value={txMaxFeePerGas ?? ""}
                    onChange={(e) =>
                      setTxMaxFeePerGas(e.target.value === "" ? undefined : e.target.value)
                    }
                    placeholder="suggested"
                  />
                </div>
                <div className="devtools-width-220">
                  {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
                  <label className="input-label">Max Priority Fee (gwei)</label>
                  <input
                    className="devtools-input"
                    value={txMaxPriorityFeePerGas ?? ""}
                    onChange={(e) =>
                      setTxMaxPriorityFeePerGas(e.target.value === "" ? undefined : e.target.value)
                    }
                    placeholder="suggested"
                  />
                </div>
              </div>
            )}

            <div className="tx-builder-signing-row">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label devtools-margin-right-8">Signing</label>
              <select
                className="devtools-input devtools-width-220"
                value={useMetaMask ? "metamask" : "local"}
                onChange={(e) => setUseMetaMask(e.target.value === "metamask")}
              >
                <option value="metamask">MetaMask / Injected</option>
                <option value="local">Local Private Key</option>
              </select>
              {!useMetaMask && (
                <input
                  className="devtools-input mono tx-builder-pk-input"
                  placeholder="0xYOURPRIVATEKEY"
                  value={localPrivateKey}
                  onChange={(e) => setLocalPrivateKey(e.target.value)}
                />
              )}
            </div>

            <div className="tx-builder-buttons">
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button className="devtools-button" onClick={estimateGasAndFees}>
                Estimate Gas & Fees
              </button>
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                className="devtools-button"
                onClick={() => {
                  // biome-ignore lint/suspicious/noExplicitAny: <TODO>
                  if ((window as any).ethereum)
                    fetchNonceForAddress(
                      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
                      (window as any).ethereum.selectedAddress ||
                        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
                        (window as any).ethereum?.accounts?.[0],
                    );
                }}
              >
                Fetch Nonce
              </button>
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button className="devtools-button" onClick={buildTransaction}>
                Build Transaction
              </button>
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                className="devtools-button devtools-button-primary"
                onClick={sendTransaction}
                disabled={txSending}
              >
                {txSending ? "Sending..." : "Sign & Send"}
              </button>
            </div>

            {estimatedGas && (
              <div className="devtools-results">
                <div>
                  Estimated Gas: <span className="mono">{estimatedGas}</span>
                  {txWillRevert && (
                    <span className="tx-fallback-estimate">(fallback estimate)</span>
                  )}
                </div>
                {suggestedFees && (
                  <div>
                    Suggested:{" "}
                    <span className="mono">
                      {txType === 0
                        ? `${suggestedFees.gasPrice ? formatUnits(suggestedFees.gasPrice, "gwei") : "N/A"} gwei`
                        : `${suggestedFees.maxFeePerGas ? formatUnits(suggestedFees.maxFeePerGas, "gwei") : "N/A"} / ${suggestedFees.maxPriorityFeePerGas ? formatUnits(suggestedFees.maxPriorityFeePerGas, "gwei") : "N/A"} gwei`}
                    </span>
                  </div>
                )}
                {estimatedCostEth && (
                  <div>
                    Estimated Cost: <span className="mono">{estimatedCostEth} ETH</span>{" "}
                    {estimatedCostUsd && <span> (~${estimatedCostUsd} USD)</span>}
                  </div>
                )}
              </div>
            )}

            {builtTx && (
              <div className="devtools-results">
                <div className="tx-built-header">Unsigned Transaction:</div>
                <textarea
                  className="devtools-input mono tx-builder-built-tx-textarea"
                  value={builtTx}
                  readOnly
                />
                {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
                <button
                  className="devtools-button devtools-margin-top-8"
                  onClick={() => navigator.clipboard.writeText(builtTx)}
                >
                  Copy to Clipboard
                </button>
              </div>
            )}

            {txWillRevert && (
              <div className="devtools-error tx-revert-warning">
                ⚠️ Transaction will likely revert!
                {revertReason && <div className="tx-revert-warning-text">{revertReason}</div>}
              </div>
            )}

            {txHashResult && (
              <div className="devtools-results">
                Transaction sent:{" "}
                <a
                  className="mono devtools-results-link"
                  href={`https://etherscan.io/tx/${txHashResult}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {txHashResult}
                </a>
              </div>
            )}

            {txError && <div className="devtools-error">{txError}</div>}
          </div>
        )}
      </div>

      {/* Advanced: Raw RLP Section */}
      <div className="devtools-card">
        {/** biome-ignore lint/a11y/noStaticElementInteractions: <TODO> */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: <TODO> */}
        <div
          className="devtools-tool-header cursor-pointer"
          onClick={() => setShowAdvancedRaw(!showAdvancedRaw)}
        >
          <h3 className="devtools-tool-title">📦 Raw RLP Transaction</h3>
          <span className="devtools-section-toggle">{showAdvancedRaw ? "▼" : "▶"}</span>
        </div>
        {showAdvancedRaw && (
          <div className="raw-rlp-container">
            <div className="devtools-flex-column devtools-gap-4">
              {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO> */}
              <label className="input-label">Signed Transaction (RLP hex)</label>
              <textarea
                className="devtools-input mono tx-builder-raw-rlp-textarea"
                value={rawRlp}
                onChange={(e) => setRawRlp(e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="raw-rlp-buttons">
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button className="devtools-button" onClick={sendRawRlpTx} disabled={txSending}>
                {txSending ? "Sending..." : "Send Raw Transaction"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsSection;
