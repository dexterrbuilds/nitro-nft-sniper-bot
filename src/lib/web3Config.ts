
import { createConfig } from 'wagmi'
import { http } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'
import { ethers } from 'ethers'

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
})

// Chain options for the UI
export const chainOptions = [
  { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH' },
  { id: 5, name: 'Goerli Testnet', symbol: 'ETH' },
  { id: 11155111, name: 'Sepolia Testnet', symbol: 'ETH' },
  { id: 137, name: 'Polygon Mainnet', symbol: 'MATIC' },
  { id: 80001, name: 'Mumbai Testnet', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum One', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
  { id: 56, name: 'BSC Mainnet', symbol: 'BNB' },
  { id: 8453, name: 'Base Chain', symbol: 'ETH' },
  { id: 84531, name: 'Base Goerli', symbol: 'ETH' },
  { id: 16384, name: 'Ape Chain', symbol: 'APE' },
];

// Get Ethers provider for different chains
export const getEthersProvider = (chainId: number) => {
  switch (chainId) {
    case 1:
      return new ethers.JsonRpcProvider('https://eth.llamarpc.com');
    case 5:
      return new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_goerli');
    case 11155111:
      return new ethers.JsonRpcProvider('https://rpc.sepolia.org');
    case 137:
      return new ethers.JsonRpcProvider('https://polygon-rpc.com');
    case 80001:
      return new ethers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
    case 42161:
      return new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    case 10:
      return new ethers.JsonRpcProvider('https://mainnet.optimism.io');
    case 56:
      return new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
    case 8453:
      return new ethers.JsonRpcProvider('https://mainnet.base.org');
    case 84531:
      return new ethers.JsonRpcProvider('https://goerli.base.org');
    case 16384:
      return new ethers.JsonRpcProvider('https://apechain.drpc.org');
    default:
      return new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  }
};

// Store for private key signer
let privateKeySigner: ethers.Signer | null = null;

// Connect with private key function
export const connectWithPrivateKey = async (privateKey: string): Promise<ethers.Signer | null> => {
  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);
    
    // Connect to default provider (Ethereum mainnet)
    const provider = getEthersProvider(1);
    const signer = wallet.connect(provider);
    
    // Store the signer
    privateKeySigner = signer;
    
    // Dispatch custom event for components to listen to
    const event = new CustomEvent('privateKeyConnected', {
      detail: { signer }
    });
    window.dispatchEvent(event);
    
    return signer;
  } catch (error) {
    console.error('Error connecting with private key:', error);
    return null;
  }
};

// Get current private key signer
export const getPrivateKeySigner = (): ethers.Signer | null => {
  return privateKeySigner;
};
