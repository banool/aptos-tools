import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const API_KEYS: Partial<Record<Network, string>> = {
  [Network.TESTNET]: 'AG-3ZWNQLWCMKMTPV79UCW4VJAAB3VBL76DA',
  [Network.MAINNET]: 'AG-GZHXVVPRMWVOWQZTQCK75ADYWKQQEG5ML',
};

export interface CustomNetwork {
  id: string;
  name: string;
  url: string;
}

const STORAGE_KEY_CUSTOM = 'aptos-tools:custom-networks';
const STORAGE_KEY_SELECTED = 'aptos-tools:selected-network';

function loadCustomNetworks(): CustomNetwork[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomNetworks(networks: CustomNetwork[]) {
  localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(networks));
}

function loadSelectedNetwork(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_SELECTED) || 'mainnet';
  } catch {
    return 'mainnet';
  }
}

function saveSelectedNetwork(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED, id);
  } catch {
    // Ignore storage errors.
  }
}

interface BuiltinNetworkInfo {
  name: string;
  url: string;
  sdkNetwork: Network;
  explorerParam: string;
}

const BUILTIN_NETWORKS: Record<string, BuiltinNetworkInfo> = {
  mainnet: {
    name: 'Mainnet',
    url: 'https://api.mainnet.aptoslabs.com/v1',
    sdkNetwork: Network.MAINNET,
    explorerParam: 'mainnet',
  },
  testnet: {
    name: 'Testnet',
    url: 'https://api.testnet.aptoslabs.com/v1',
    sdkNetwork: Network.TESTNET,
    explorerParam: 'testnet',
  },
  devnet: {
    name: 'Devnet',
    url: 'https://api.devnet.aptoslabs.com/v1',
    sdkNetwork: Network.DEVNET,
    explorerParam: 'devnet',
  },
  shelbynet: {
    name: 'Shelbynet',
    url: 'https://api.shelbynet.aptoslabs.com/v1',
    sdkNetwork: Network.CUSTOM,
    explorerParam: 'shelbynet',
  },
};

function buildAptos(networkId: string, customNetworks: CustomNetwork[]): Aptos {
  const builtin = BUILTIN_NETWORKS[networkId];
  if (builtin) {
    const apiKey = API_KEYS[builtin.sdkNetwork];
    if (builtin.sdkNetwork === Network.CUSTOM) {
      return new Aptos(new AptosConfig({ network: Network.CUSTOM, fullnode: builtin.url }));
    }
    return new Aptos(
      new AptosConfig({ network: builtin.sdkNetwork, clientConfig: { API_KEY: apiKey } }),
    );
  }

  const custom = customNetworks.find((n) => n.id === networkId);
  if (custom) {
    return new Aptos(new AptosConfig({ network: Network.CUSTOM, fullnode: custom.url }));
  }

  return new Aptos(new AptosConfig({ network: Network.MAINNET }));
}

function getNodeUrl(networkId: string, customNetworks: CustomNetwork[]): string {
  const builtin = BUILTIN_NETWORKS[networkId];
  if (builtin) return builtin.url;
  const custom = customNetworks.find((n) => n.id === networkId);
  if (custom) return custom.url;
  return BUILTIN_NETWORKS.mainnet.url;
}

function getExplorerNetworkParam(networkId: string): string | null {
  const builtin = BUILTIN_NETWORKS[networkId];
  if (builtin) return builtin.explorerParam;
  return null;
}

function getNetworkDisplayName(networkId: string, customNetworks: CustomNetwork[]): string {
  const builtin = BUILTIN_NETWORKS[networkId];
  if (builtin) return builtin.name;
  const custom = customNetworks.find((n) => n.id === networkId);
  if (custom) return custom.name;
  return networkId;
}

interface AptosContextType {
  aptos: Aptos;
  networkId: string;
  networkDisplayName: string;
  nodeUrl: string;
  explorerNetworkParam: string | null;
  setNetworkId: (id: string) => void;
  customNetworks: CustomNetwork[];
  addCustomNetwork: (name: string, url: string) => CustomNetwork;
  removeCustomNetwork: (id: string) => void;
}

const AptosContext = createContext<AptosContextType | undefined>(undefined);

export function AptosProvider({ children }: { children: ReactNode }) {
  const [customNetworks, setCustomNetworks] = useState<CustomNetwork[]>(loadCustomNetworks);
  const [networkId, setNetworkIdRaw] = useState<string>(() => {
    const saved = loadSelectedNetwork();
    if (BUILTIN_NETWORKS[saved]) return saved;
    const customs = loadCustomNetworks();
    if (customs.some((n) => n.id === saved)) return saved;
    return 'mainnet';
  });

  const setNetworkId = useCallback((id: string) => {
    setNetworkIdRaw(id);
    saveSelectedNetwork(id);
  }, []);

  const addCustomNetwork = useCallback(
    (name: string, url: string): CustomNetwork => {
      const id = `custom-${Date.now()}`;
      const network: CustomNetwork = { id, name, url: url.replace(/\/+$/, '') };
      const updated = [...customNetworks, network];
      setCustomNetworks(updated);
      saveCustomNetworks(updated);
      return network;
    },
    [customNetworks],
  );

  const removeCustomNetwork = useCallback(
    (id: string) => {
      const updated = customNetworks.filter((n) => n.id !== id);
      setCustomNetworks(updated);
      saveCustomNetworks(updated);
      if (networkId === id) {
        setNetworkId('mainnet');
      }
    },
    [customNetworks, networkId, setNetworkId],
  );

  const aptos = buildAptos(networkId, customNetworks);
  const nodeUrl = getNodeUrl(networkId, customNetworks);
  const explorerNetworkParam = getExplorerNetworkParam(networkId);
  const networkDisplayName = getNetworkDisplayName(networkId, customNetworks);

  return (
    <AptosContext.Provider
      value={{
        aptos,
        networkId,
        networkDisplayName,
        nodeUrl,
        explorerNetworkParam,
        setNetworkId,
        customNetworks,
        addCustomNetwork,
        removeCustomNetwork,
      }}
    >
      {children}
    </AptosContext.Provider>
  );
}

export function useAptos() {
  const context = useContext(AptosContext);
  if (context === undefined) {
    throw new Error('useAptos must be used within an AptosProvider');
  }
  return context;
}
