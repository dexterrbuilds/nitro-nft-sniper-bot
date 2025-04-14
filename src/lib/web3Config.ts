
import { createConfig, configureChains } from 'wagmi';
import { mainnet, goerli, sepolia, polygonMumbai, polygon, arbitrum, optimism, bsc } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import WalletConnectProvider from '@walletconnect/web3-provider';

// Fallback RPC URLs for each chain
const getRpcUrl = (chainId: number) => {
  switch (chainId) {
    case mainnet.id:
      return "https://eth-mainnet.g.alchemy.com/v2/demo";
    case goerli.id:
      return "https://eth-goerli.g.alchemy.com/v2/demo";
    case sepolia.id:
      return "https://eth-sepolia.g.alchemy.com/v2/demo";
    case polygon.id:
      return "https://polygon-mainnet.g.alchemy.com/v2/demo";
    case polygonMumbai.id:
      return "https://polygon-mumbai.g.alchemy.com/v2/demo";
    case arbitrum.id:
      return "https://arb-mainnet.g.alchemy.com/v2/demo";
    case optimism.id:
      return "https://opt-mainnet.g.alchemy.com/v2/demo";
    case bsc.id:
      return "https://bsc-dataseed.binance.org";
    default:
      return "https://eth-mainnet.g.alchemy.com/v2/demo";
  }
};

// Configure chains for app using only jsonRpcProvider
export const { chains, publicClient } = configureChains(
  [mainnet, goerli, sepolia, polygon, polygonMumbai, arbitrum, optimism, bsc],
  [
    // Use only jsonRpcProvider instead of publicProvider to avoid the error
    jsonRpcProvider({
      rpc: (chain) => ({
        http: getRpcUrl(chain.id),
      }),
    }),
  ]
);

// Set up wagmi config with only MetaMask connector
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ 
      chains,
      options: {
        shimDisconnect: true,
        UNSTABLE_shimOnConnectSelectAccount: true,
      }
    }),
  ],
  publicClient,
});

// Connect with MetaMask using detect-provider
export const connectWithMetaMask = async (): Promise<ethers.Signer | null> => {
  try {
    const provider = await detectEthereumProvider({ silent: true });
    
    if (provider) {
      // Create a provider from the detected provider
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      
      // Request accounts from the user
      await (provider as any).request({ method: 'eth_requestAccounts' });
      
      // Get the signer (connected account)
      const signer = await ethersProvider.getSigner();
      return signer;
    }
    return null;
  } catch (error) {
    console.error('Error connecting with MetaMask:', error);
    return null;
  }
};

// Connect with WalletConnect
export const connectWithWalletConnect = async (): Promise<ethers.Signer | null> => {
  try {
    // Initialize WalletConnect Provider
    const wcProvider = new WalletConnectProvider({
      rpc: {
        1: getRpcUrl(1), // Ethereum Mainnet
        5: getRpcUrl(5), // Goerli
        11155111: getRpcUrl(11155111), // Sepolia
        137: getRpcUrl(137), // Polygon Mainnet
        80001: getRpcUrl(80001), // Polygon Mumbai
        42161: getRpcUrl(42161), // Arbitrum
        10: getRpcUrl(10), // Optimism
        56: getRpcUrl(56), // BSC
      },
    });
    
    // Enable session (triggers QR Code modal)
    await wcProvider.enable();
    
    // Create ethers provider with WalletConnect
    const ethersProvider = new ethers.Web3Provider(wcProvider as any);
    const signer = ethersProvider.getSigner();
    return signer;
  } catch (error) {
    console.error('Error connecting with WalletConnect:', error);
    return null;
  }
};

// Direct Ethers.js connection function (tries MetaMask first, then falls back)
export const connectWithEthers = async (): Promise<ethers.Signer | null> => {
  try {
    // First try MetaMask
    const metaMaskSigner = await connectWithMetaMask();
    if (metaMaskSigner) return metaMaskSigner;
    
    // If MetaMask failed, try WalletConnect
    const wcSigner = await connectWithWalletConnect();
    if (wcSigner) return wcSigner;
    
    return null;
  } catch (error) {
    console.error('Error connecting with ethers:', error);
    return null;
  }
};

// Helper to get ethers provider for a specific chain
export const getEthersProvider = (chainId: number): ethers.JsonRpcProvider => {
  const rpcUrl = getRpcUrl(chainId);
  return new ethers.JsonRpcProvider(rpcUrl);
};

// Chain options for the UI
export const chainOptions = [
  { id: mainnet.id, name: 'Ethereum Mainnet' },
  { id: goerli.id, name: 'Goerli Testnet' },
  { id: sepolia.id, name: 'Sepolia Testnet' },
  { id: polygon.id, name: 'Polygon Mainnet' },
  { id: polygonMumbai.id, name: 'Polygon Mumbai' },
  { id: arbitrum.id, name: 'Arbitrum' },
  { id: optimism.id, name: 'Optimism' },
  { id: bsc.id, name: 'Binance Smart Chain' },
];
