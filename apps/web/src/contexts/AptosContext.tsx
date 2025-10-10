import { createContext, useContext, useState, ReactNode } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const API_KEYS: Partial<Record<Network, string>> = {
  [Network.TESTNET]: 'AG-3ZWNQLWCMKMTPV79UCW4VJAAB3VBL76DA',
  [Network.MAINNET]: 'AG-GZHXVVPRMWVOWQZTQCK75ADYWKQQEG5ML',
};

interface AptosContextType {
  aptos: Aptos;
  network: Network;
  setNetwork: (network: Network) => void;
}

const AptosContext = createContext<AptosContextType | undefined>(undefined);

export function AptosProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<Network>(Network.MAINNET);

  const apiKey = API_KEYS[network];

  const config = new AptosConfig({ network, clientConfig: { API_KEY: apiKey } });
  const aptos = new Aptos(config);

  return (
    <AptosContext.Provider value={{ aptos, network, setNetwork }}>{children}</AptosContext.Provider>
  );
}

export function useAptos() {
  const context = useContext(AptosContext);
  if (context === undefined) {
    throw new Error('useAptos must be used within an AptosProvider');
  }
  return context;
}
