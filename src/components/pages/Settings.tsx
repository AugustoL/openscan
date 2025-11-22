import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import type { RpcUrlsContextType } from '../../types';

const Settings: React.FC = () => {
  const { rpcUrls, setRpcUrls } = useContext(AppContext);

  const [localRpc, setLocalRpc] = useState<RpcUrlsContextType>({ ...rpcUrls });

  const updateField = (key: keyof RpcUrlsContextType, value: string) => {
    setLocalRpc(prev => ({ ...prev, [key]: value }));
  };

  const save = () => {
    // Convert comma-separated strings into arrays for each chainId
    const parsed: RpcUrlsContextType = Object.keys(localRpc).reduce((acc, key) => {
      const k = Number(key) as unknown as keyof RpcUrlsContextType;
      const val = (localRpc as any)[k];
      if (typeof val === 'string') {
        const arr = val
          .split(',') 
          .map(s => s.trim())
          .filter(Boolean); // Previene errores por multiples comas (,,,)  
        (acc as any)[k] = arr;
      } else {
        (acc as any)[k] = val;
      }
      return acc;
    }, {} as RpcUrlsContextType);

    setRpcUrls(parsed);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Settings</h2>

      <section style={{ marginBottom: 12 }}>
        <h3>RPC URLs</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
          <label>
            Ethereum Mainnet (chainId: 1)
            <input
              style={{ width: '100%', padding: 8, marginTop: 4 }}
              value={localRpc[1]}
              onChange={(e) => updateField(1 as keyof RpcUrlsContextType, e.target.value)}
            />
          </label>

          <label>
            Sepolia (chainId: 11155111)
            <input
              style={{ width: '100%', padding: 8, marginTop: 4 }}
              value={localRpc[11155111]}
              onChange={(e) => updateField(11155111 as keyof RpcUrlsContextType, e.target.value)}
            />
          </label>

          <label>
            Local Hardhat (chainId: 31337)
            <input
              style={{ width: '100%', padding: 8, marginTop: 4 }}
              value={localRpc[31337]}
              onChange={(e) => updateField(31337 as keyof RpcUrlsContextType, e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={{ padding: '8px 12px' }}>Save</button>
          </div>
        </div>
      </section>

      <section>
        <h3>Current RPC URLs</h3>
        <pre style={{ background: '#f6f8fa', padding: 12 }}>{JSON.stringify(rpcUrls, null, 2)}</pre>
      </section>
    </div>
  );
};

export default Settings;
