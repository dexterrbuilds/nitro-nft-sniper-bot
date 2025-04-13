
import { createConfig, configureChains } from 'wagmi';
import { mainnet, goerli, sepolia, polygonMumbai, polygon, arbitrum, optimism, bsc } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';

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

// Set up wagmi config with connectors
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
    new WalletConnectConnector({
      chains,
      options: {
        projectId: "a8556aedd0715bd8201a74bfb9881b66", // This is a demo project ID
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'dark'
        }
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
