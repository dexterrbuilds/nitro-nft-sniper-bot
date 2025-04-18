import { createConfig, configureChains } from 'wagmi';
import { mainnet, goerli, sepolia, polygonMumbai, polygon, arbitrum, optimism, bsc } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import EthereumProvider from '@walletconnect/ethereum-provider';

const base = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.base.org'] },
    default: { http: ['https://mainnet.base.org'] },
  },
};

const apeChain = {
  id: 16384,
  name: 'ApeCoin',
  network: 'apechain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    public: { http: ['https://rpc.ankr.com/apecoin'] },
    default: { http: ['https://rpc.ankr.com/apecoin'] },
  },
};

const baseGoerli = {
  id: 84531,
  name: 'Base Goerli',
  network: 'base-goerli',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://goerli.base.org'] },
    default: { http: ['https://goerli.base.org'] },
  },
};

const getRpcUrl = (chainId: number) => {
  switch (chainId) {
    case mainnet.id:
      return "https://eth.llamarpc.com";
    case goerli.id:
      return "https://rpc.ankr.com/eth_goerli";
    case sepolia.id:
      return "https://rpc.sepolia.org";
    case polygon.id:
      return "https://polygon-rpc.com";
    case polygonMumbai.id:
      return "https://rpc-mumbai.maticvigil.com";
    case arbitrum.id:
      return "https://arb1.arbitrum.io/rpc";
    case optimism.id:
      return "https://mainnet.optimism.io";
    case bsc.id:
      return "https://bsc-dataseed.binance.org";
    case base.id:
      return "https://base-mainnet.infura.io/v3/e71df1da5d774ea39acec70e9b6091df";
    case baseGoerli.id:
      return "https://goerli.base.org";
    case apeChain.id:
      return "https://rpc.ankr.com/apecoin";
    default:
      return "https://eth.llamarpc.com";
  }
};

export const { chains, publicClient } = configureChains(
  [mainnet, goerli, sepolia, polygon, polygonMumbai, arbitrum, optimism, bsc, base, baseGoerli, apeChain],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: getRpcUrl(chain.id),
      }),
    }),
  ]
);

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

const connectWithMetaMask = async (): Promise<ethers.Signer | null> => {
  try {
    const provider = await detectEthereumProvider({ silent: true });
    
    if (provider) {
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      await (provider as any).request({ method: 'eth_requestAccounts' });
      const signer = await ethersProvider.getSigner();
      return signer;
    }
    console.log('No Ethereum provider detected');
    return null;
  } catch (error) {
    console.error('Error connecting with MetaMask:', error);
    return null;
  }
};

const connectWithWalletConnect = async (): Promise<ethers.Signer | null> => {
  try {
    const wcProvider = await EthereumProvider.init({
      projectId: "952483bf48a8bff80731c419eb59d865",
      chains: [1, 5, 11155111, 137, 80001, 42161, 10, 56, 8453, 84531, 16384],
      showQrModal: true,
      rpcMap: {
        1: getRpcUrl(1),
        5: getRpcUrl(5),
        11155111: getRpcUrl(11155111),
        137: getRpcUrl(137),
        80001: getRpcUrl(80001),
        42161: getRpcUrl(42161),
        10: getRpcUrl(10),
        56: getRpcUrl(56),
        8453: getRpcUrl(8453),
        84531: getRpcUrl(84531),
        16384: getRpcUrl(16384),
      }
    });
    
    await wcProvider.enable();
    const ethersProvider = new ethers.BrowserProvider(wcProvider as any);
    const signer = await ethersProvider.getSigner();
    return signer;
  } catch (error) {
    console.error('Error connecting with WalletConnect:', error);
    return null;
  }
};

export const connectWithPrivateKey = async (privateKey: string): Promise<ethers.Signer | null> => {
  try {
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    
    const chainId = 1;
    const rpcUrl = getRpcUrl(chainId);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    return wallet;
  } catch (error) {
    console.error('Error connecting with private key:', error);
    return null;
  }
};

export const getEthersProvider = (chainId: number): ethers.JsonRpcProvider => {
  const rpcUrl = getRpcUrl(chainId);
  return new ethers.JsonRpcProvider(rpcUrl);
};

export const chainOptions = [
  { id: base.id, name: 'Base Chain' },
  { id: baseGoerli.id, name: 'Base Goerli (Coming Soon)', disabled: true },
  { id: mainnet.id, name: 'Ethereum Mainnet (Coming Soon)', disabled: true },
  { id: polygon.id, name: 'Polygon (Coming Soon)', disabled: true },
  { id: arbitrum.id, name: 'Arbitrum (Coming Soon)', disabled: true },
  { id: optimism.id, name: 'Optimism (Coming Soon)', disabled: true },
  { id: bsc.id, name: 'Binance Smart Chain (Coming Soon)', disabled: true },
];
