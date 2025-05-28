import { ethers } from 'ethers'

// Chain options for the UI (removed Ethereum Mainnet)
export const chainOptions = [
  { id: 5, name: 'Goerli Testnet', symbol: 'ETH' },
  { id: 11155111, name: 'Sepolia Testnet', symbol: 'ETH' },
  { id: 137, name: 'Polygon Mainnet', symbol: 'MATIC' },
  { id: 80001, name:'Mumbai Testnet', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum One', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
  { id: 56, name: 'BSC Mainnet', symbol: 'BNB' },
  { id: 8453, name: 'Base Chain', symbol: 'ETH' },
  { id: 84531, name: 'Base Goerli', symbol: 'ETH' },
  { id: 16384, name: 'Ape Chain', symbol: 'APE' },
];

// Get Ethers provider for different chains
export const getEthersProvider = (chainId: number) => {
  const rpcUrls: Record<number, string> = {
    5: 'https://rpc.ankr.com/eth_goerli',
    11155111: 'https://rpc.sepolia.org',
    137: 'https://polygon-rpc.com',
    80001: 'https://rpc-mumbai.maticvigil.com',
    42161: 'https://arb1.arbitrum.io/rpc',
    10: 'https://mainnet.optimism.io',
    56: 'https://bsc-dataseed.binance.org',
    8453: 'https://mainnet.base.org',
    84531: 'https://goerli.base.org',
    16384: 'https://apechain.drpc.org',
  };

  const rpcUrl = rpcUrls[chainId] || rpcUrls[5]; // Default to Goerli instead of mainnet
  return new ethers.JsonRpcProvider(rpcUrl);
};

// Store for private key signer
let privateKeySigner: ethers.Signer | null = null;

// Connect with private key function
export const connectWithPrivateKey = async (privateKey: string): Promise<ethers.Signer | null> => {
  try {
    // Clean the private key (remove 0x prefix if present)
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    
    // Validate private key format (should be 64 hex characters)
    if (!/^[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
      throw new Error('Invalid private key format');
    }
    
    // Create wallet from private key
    const wallet = new ethers.Wallet('0x' + cleanPrivateKey);
    
    // Connect to default provider (Goerli instead of mainnet)
    const provider = getEthersProvider(5);
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
    throw error;
  }
};

// Get current private key signer
export const getPrivateKeySigner = (): ethers.Signer | null => {
  return privateKeySigner;
};

// Disconnect wallet
export const disconnectWallet = () => {
  privateKeySigner = null;
  // Dispatch disconnect event
  const event = new CustomEvent('walletDisconnected');
  window.dispatchEvent(event);
};
