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

// Updated Ape Chain configuration with improved RPC URLs
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
    public: { http: ['https://rpc.ankr.com/apecoin', 'https://ape-chain.rpc.thirdweb.com'] },
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

const beraChain = {
  id: 80085,
  name: 'Berachain',
  network: 'berachain',
  nativeCurrency: {
    decimals: 18,
    name: 'BERA',
    symbol: 'BERA',
  },
  rpcUrls: {
    public: { http: ['https://berachain-mainnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR'] },
    default: { http: ['https://berachain-mainnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR'] },
  },
};

const monadChain = {
  id: 1881,
  name: 'Monad',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MONAD',
  },
  rpcUrls: {
    public: { http: ['https://monad-testnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR'] },
    default: { http: ['https://monad-testnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR'] },
  },
};

const abstractChain = {
  id: 1718,
  name: 'Abstract',
  network: 'abstract-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Abstract',
    symbol: 'ABS',
  },
  rpcUrls: {
    public: { http: ['https://abstract-mainnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR'] },
    default: { http: ['https://abstract-mainnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR'] },
  },
};

// API Keys for block explorers
const API_KEYS = {
  ETHERSCAN: 'NPXSNH347JW6C5XBKWG89DJD6CK2CSCVNT',
  POLYGONSCAN: 'VPW7RMZTKZN8MGUCIFEKG5PCGJVXYGBMGJ',
  ARBISCAN: '6IZXNSA7G3DYP1CHKX78YVS6T62CHMWMJ8',
  OPTIMISTIC_ETHERSCAN: 'R6UEUF6GBJ87SAYWPCQ3C4JFBM6A2CPFN1',
  BSCSCAN: 'YKPWT5K3G5AMK8XV77CUWTNCGF1IXJ4P39',
  BASESCAN: '8UQEY8RYB6GM76IMIGNZTU29K3KA5UNN8P',
  APESCAN: 'AUIZ36FWI8V2QVIKBZ4NWJZQ4D4JQ5PRX7'
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
    case beraChain.id:
      return "https://berachain-mainnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR";
    case monadChain.id:
      return "https://monad-testnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR";
    case abstractChain.id:
      return "https://abstract-mainnet.g.alchemy.com/v2/HH7IEuZ2i6-7pXDbtM3LHG_0zOHao5LR";
    default:
      return "https://eth.llamarpc.com";
  }
};

export const { chains, publicClient } = configureChains(
  [mainnet, goerli, sepolia, polygon, polygonMumbai, arbitrum, optimism, bsc, base, baseGoerli, apeChain, beraChain, monadChain, abstractChain],
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
      chains: [1, 5, 11155111, 137, 80001, 42161, 10, 56, 8453, 84531, 16384, 80085, 1881, 1718],
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
        16384: getRpcUrl(16384), // Ape Chain
        80085: getRpcUrl(80085),
        1881: getRpcUrl(1881),
        1718: getRpcUrl(1718),
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

const dispatchPrivateKeyEvent = (signer: ethers.Signer) => {
  const event = new CustomEvent('privateKeyConnected', {
    detail: { signer }
  });
  window.dispatchEvent(event);
};

export const connectWithPrivateKey = async (privateKey: string): Promise<ethers.Signer | null> => {
  try {
    privateKey = privateKey.trim();
    
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    
    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error('Invalid private key format');
    }
    
    // Default to Base Chain for private key connection
    const chainId = 8453; // Base Chain
    const rpcUrl = getRpcUrl(chainId);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    dispatchPrivateKeyEvent(wallet);
    
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

// Updated chain options to prioritize Base Chain
export const chainOptions = [
  { id: base.id, name: 'Base Chain' },
  { id: apeChain.id, name: 'Ape Chain' },
  { id: beraChain.id, name: 'Berachain' },
  { id: monadChain.id, name: 'Monad Testnet' },
  { id: abstractChain.id, name: 'Abstract' },
];

// Get block explorer API URL based on chain ID
export const getBlockExplorerApiUrl = (chainId: number, address: string): string | null => {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.ETHERSCAN}`;
    case 5: // Goerli
      return `https://api-goerli.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.ETHERSCAN}`;
    case 11155111: // Sepolia
      return `https://api-sepolia.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.ETHERSCAN}`;
    case 137: // Polygon
      return `https://api.polygonscan.com/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.POLYGONSCAN}`;
    case 80001: // Mumbai
      return `https://api-testnet.polygonscan.com/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.POLYGONSCAN}`;
    case 42161: // Arbitrum
      return `https://api.arbiscan.io/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.ARBISCAN}`;
    case 10: // Optimism
      return `https://api-optimistic.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.OPTIMISTIC_ETHERSCAN}`;
    case 56: // BSC
      return `https://api.bscscan.com/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.BSCSCAN}`;
    case 8453: // Base
      return `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.BASESCAN}`;
    case 84531: // Base Goerli
      return `https://api-goerli.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.BASESCAN}`;
    case 16384: // Ape Chain
      return `https://api.apescan.io/api?module=contract&action=getabi&address=${address}&apikey=${API_KEYS.APESCAN}`;
    default:
      return null;
  }
};
