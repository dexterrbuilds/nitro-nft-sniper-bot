
import { createConfig, configureChains } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { publicProvider } from 'wagmi/providers/public';
import { ethers } from 'ethers';

// Define chain configurations
export const baseChain = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
  testnet: false,
};

export const apeChain = {
  id: 16384,
  name: 'Ape Chain',
  nativeCurrency: { name: 'ApeCoin', symbol: 'APE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.apechain.com'] },
    public: { http: ['https://rpc.apechain.com'] },
  },
  blockExplorers: {
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: false,
};

export const chainOptions = [baseChain, apeChain];

const { chains, publicClient } = configureChains(
  chainOptions,
  [
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id === baseChain.id) {
          return { http: 'https://mainnet.base.org' };
        }
        if (chain.id === apeChain.id) {
          return { http: 'https://rpc.apechain.com' };
        }
        return null;
      },
    }),
    publicProvider(),
  ]
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
});

// Private key signer management
let privateKeySigner: ethers.Signer | null = null;

export const connectWithPrivateKey = async (privateKey: string): Promise<ethers.Signer | null> => {
  try {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const signer = new ethers.Wallet(privateKey, provider);
    
    // Verify the private key is valid by getting the address
    await signer.getAddress();
    
    privateKeySigner = signer;
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('privateKeyConnected', {
      detail: { signer }
    }));
    
    return signer;
  } catch (error) {
    console.error('Invalid private key:', error);
    return null;
  }
};

export const getPrivateKeySigner = (): ethers.Signer | null => {
  return privateKeySigner;
};

export const disconnectPrivateKey = (): void => {
  privateKeySigner = null;
  window.dispatchEvent(new CustomEvent('privateKeyDisconnected'));
};
