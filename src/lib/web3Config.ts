
import { createConfig, configureChains } from 'wagmi';
import { mainnet, goerli, sepolia, polygonMumbai, polygon, arbitrum, optimism, bsc } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';

// Configure chains for app
export const { chains, publicClient } = configureChains(
  [mainnet, goerli, sepolia, polygon, polygonMumbai, arbitrum, optimism, bsc],
  [publicProvider()]
);

// Set up wagmi config with connectors
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'YOUR_PROJECT_ID', // Replace with actual project ID if needed
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'Nitro NFT Sniper',
      },
    }),
  ],
  publicClient,
});

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
