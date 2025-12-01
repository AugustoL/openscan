import type React from "react";
import { useContext, useMemo, useState } from "react";
import { getEnabledNetworks } from "../../config/networks";
import { AppContext } from "../../context/AppContext";
import { useSettings } from "../../context/SettingsContext";
import type { RPCUrls, RpcUrlsContextType } from "../../types";

const Settings: React.FC = () => {
  const { rpcUrls, setRpcUrls } = useContext(AppContext);
  const { settings, updateSettings } = useSettings();
  const [localRpc, setLocalRpc] = useState<Record<number, string | RPCUrls>>({
    ...rpcUrls,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateField = (key: keyof RpcUrlsContextType, value: string) => {
    setLocalRpc((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    // Convert comma-separated strings into arrays for each chainId
    const parsed: RpcUrlsContextType = Object.keys(localRpc).reduce((acc, key) => {
      const k = Number(key) as unknown as keyof RpcUrlsContextType;
      // biome-ignore lint/suspicious/noExplicitAny: <TODO>
      const val = (localRpc as any)[k];
      if (typeof val === "string") {
        const arr = val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean); // Previene errores por multiples comas (,,,)
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
        (acc as any)[k] = arr;
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: <TODO>
        (acc as any)[k] = val;
      }
      return acc;
    }, {} as RpcUrlsContextType);

    setRpcUrls(parsed);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Get enabled networks from config
  const chainConfigs = useMemo(() => {
    return getEnabledNetworks().map((network) => ({
      id: network.chainId,
      name: network.name,
    }));
  }, []);

  return (
    <div className="container-wide settings-container">
      {/* Success Message */}
      {saveSuccess && (
        <div className="settings-success-message">✓ Settings saved successfully!</div>
      )}

      {/* Appearance Settings Section */}
      <div className="settings-section no-margin">
        <h2 className="settings-section-title">🎨 Appearance</h2>
        <p className="settings-section-description">
          Customize the visual appearance of the application.
        </p>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Funny Background Blocks</div>
            <div className="settings-item-description">
              Show animated isometric blocks in the background
            </div>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.showBackgroundBlocks ?? true}
              onChange={(e) => updateSettings({ showBackgroundBlocks: e.target.checked })}
              className="settings-toggle-input"
            />
            <span
              className={`settings-toggle-slider ${settings.showBackgroundBlocks ? "active" : ""}`}
            >
              <span
                className={`settings-toggle-knob ${settings.showBackgroundBlocks ? "active" : ""}`}
              />
            </span>
          </label>
        </div>
      </div>

      {/* RPC Strategy Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">⚡ RPC Request Strategy</h2>
        <p className="settings-section-description">
          Choose how requests are sent to multiple RPC endpoints.
        </p>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Request Strategy</div>
            <div className="settings-item-description">
              <strong>Fallback:</strong> Try endpoints one by one until one succeeds (reliable,
              slower).
              <br />
              <strong>Parallel:</strong> Query all endpoints simultaneously and use the first
              successful response (faster, more bandwidth).
            </div>
          </div>
          <select
            value={settings.rpcStrategy || "fallback"}
            onChange={(e) =>
              updateSettings({
                rpcStrategy: e.target.value as "fallback" | "parallel",
              })
            }
            className="settings-select"
          >
            <option value="fallback">Fallback (Default)</option>
            <option value="parallel">Parallel</option>
          </select>
        </div>
      </div>

      {/* RPC Configuration Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">🔗 RPC Endpoints</h2>
        <p className="settings-section-description">
          Enter comma-separated RPC URLs for each network. Multiple URLs provide fallback support.
        </p>

        <div className="flex-column settings-chain-list">
          {chainConfigs.map((chain) => (
            <div key={chain.id} className="settings-chain-item">
              <label className="flex-column settings-chain-label">
                <div className="settings-chain-name">
                  {chain.name}
                  <span className="settings-chain-id-badge">Chain ID: {chain.id}</span>
                </div>
                <input
                  className="settings-rpc-input"
                  value={localRpc[chain.id]}
                  onChange={(e) =>
                    updateField(chain.id as keyof RpcUrlsContextType, e.target.value)
                  }
                  placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY"
                />

                {/* Help text for localhost network */}
                {chain.id === 31337 && (
                  <div className="settings-help-text">
                    💡 Need to access your local network remotely?{" "}
                    <a
                      href="https://dashboard.ngrok.com/get-started/setup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="settings-link"
                    >
                      Learn how to set up a tunnel with ngrok
                    </a>
                  </div>
                )}

                {/* Display current RPC list as tags */}
                {rpcUrls[chain.id as keyof RpcUrlsContextType] &&
                  Array.isArray(rpcUrls[chain.id as keyof RpcUrlsContextType]) &&
                  (rpcUrls[chain.id as keyof RpcUrlsContextType] as string[]).length > 0 && (
                    <div className="flex-column settings-rpc-list">
                      <span className="settings-rpc-list-label">Current RPCs:</span>
                      <div className="flex-start settings-rpc-tags">
                        {(rpcUrls[chain.id as keyof RpcUrlsContextType] as string[]).map(
                          (url, idx) => (
                            <div key={url} className="settings-rpc-tag">
                              <span className="settings-rpc-tag-index">{idx + 1}</span>
                              <span className="settings-rpc-tag-url">{url}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </label>
            </div>
          ))}

          {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
          <button onClick={save} className="settings-save-button">
            💾 Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
