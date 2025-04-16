
import { ethers } from 'ethers';
import { toast } from 'sonner';

// Function to fetch ABI from contract address using Etherscan-like APIs
export const fetchContractABI = async (
  address: string, 
  chainId: number
): Promise<any[] | null> => {
  try {
    // Select the appropriate API endpoint based on the chain
    let apiUrl;
    let apiKey;
    
    // Using public API keys for demo purposes
    switch (chainId) {
      case 1: // Ethereum Mainnet
        apiUrl = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=NPXSNH347JW6C5XBKWG89DJD6CK2CSCVNT`;
        break;
      case 5: // Goerli
        apiUrl = `https://api-goerli.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=NPXSNH347JW6C5XBKWG89DJD6CK2CSCVNT`;
        break;
      case 11155111: // Sepolia
        apiUrl = `https://api-sepolia.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=NPXSNH347JW6C5XBKWG89DJD6CK2CSCVNT`;
        break;
      case 137: // Polygon
        apiUrl = `https://api.polygonscan.com/api?module=contract&action=getabi&address=${address}&apikey=VPW7RMZTKZN8MGUCIFEKG5PCGJVXYGBMGJ`;
        break;
      case 80001: // Mumbai
        apiUrl = `https://api-testnet.polygonscan.com/api?module=contract&action=getabi&address=${address}&apikey=VPW7RMZTKZN8MGUCIFEKG5PCGJVXYGBMGJ`;
        break;
      case 42161: // Arbitrum
        apiUrl = `https://api.arbiscan.io/api?module=contract&action=getabi&address=${address}&apikey=6IZXNSA7G3DYP1CHKX78YVS6T62CHMWMJ8`;
        break;
      case 10: // Optimism
        apiUrl = `https://api-optimistic.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=R6UEUF6GBJ87SAYWPCQ3C4JFBM6A2CPFN1`;
        break;
      case 56: // BSC
        apiUrl = `https://api.bscscan.com/api?module=contract&action=getabi&address=${address}&apikey=YKPWT5K3G5AMK8XV77CUWTNCGF1IXJ4P39`;
        break;
      case 8453: // Base
        apiUrl = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=TSGXSF9Y9AIPQX4YH9P4FJIXVJ65F1ZRX5`;
        break;
      default:
        console.log('No block explorer API available for this chain, using fallback ABI');
        return getFallbackABI();
    }

    if (!apiUrl) {
      console.log('No block explorer API available for this chain, using fallback ABI');
      return getFallbackABI();
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === '1' && data.result) {
      try {
        // Try to parse the ABI
        const abi = JSON.parse(data.result);
        console.log('Successfully fetched verified ABI:', abi);
        return abi;
      } catch (parseError) {
        console.error('Error parsing ABI:', parseError);
        return getFallbackABI();
      }
    } else {
      console.log('Contract not verified or not found, using fallback ABI');
      return getFallbackABI();
    }
  } catch (error) {
    console.error("Error fetching contract ABI:", error);
    toast.error("Failed to fetch contract ABI. Using a generic ABI instead.");
    return getFallbackABI();
  }
};

// Function to get a fallback ABI for common ERC standards
function getFallbackABI() {
  // Basic ERC721 ABI with common mint functions
  const basicERC721ABI = [
    // ERC721 Standard
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
    // Common mint functions
    "function mint(uint256 amount) payable",
    "function mint(address to, uint256 amount) payable",
    "function mintNFT(address recipient, uint256 tokenId) returns (uint256)",
    "function mintNFT(address recipient) returns (uint256)",
    "function mintTo(address to, uint256 amount) payable",
    "function publicMint(uint256 amount) payable",
    "function presaleMint(uint256 amount, bytes32[] proof) payable",
    // Read-only state
    "function totalSupply() view returns (uint256)",
    "function maxSupply() view returns (uint256)",
    "function mintPrice() view returns (uint256)",
    "function maxMintAmount() view returns (uint256)",
    "function paused() view returns (bool)",
    "function saleIsActive() view returns (bool)",
    "function presaleIsActive() view returns (bool)",
  ];

  // ERC20 ABI fallback
  const basicERC20ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
  ];

  // Combine these ABIs
  return [...basicERC721ABI, ...basicERC20ABI];
}

// Function to validate if a string is a valid Ethereum address
export const isValidAddress = (address: string): boolean => {
  return ethers.isAddress(address);
};

// Function to get contract functions from ABI
export const getContractFunctions = (abi: any[]): {
  writeFunctions: { name: string; inputs: any[]; payable: boolean }[];
  readFunctions: { name: string; inputs: any[]; outputs: any[] }[];
} => {
  const writeFunctions: { name: string; inputs: any[]; payable: boolean }[] = [];
  const readFunctions: { name: string; inputs: any[]; outputs: any[] }[] = [];

  for (const item of abi) {
    if (typeof item === 'string') {
      // Handle string ABI format
      try {
        const parsed = ethers.FunctionFragment.from(item);
        const name = parsed.name;
        const inputs = [...parsed.inputs].map(input => ({
          name: input.name || '',
          type: input.type,
        }));
        
        if (parsed.constant || parsed.stateMutability === 'view' || parsed.stateMutability === 'pure') {
          readFunctions.push({
            name,
            inputs,
            outputs: [...(parsed.outputs || [])],
          });
        } else {
          writeFunctions.push({
            name,
            inputs,
            payable: parsed.payable || parsed.stateMutability === 'payable',
          });
        }
      } catch (e) {
        console.error("Error parsing ABI string:", e);
        continue;
      }
    } else if (
      item.type === 'function' &&
      !item.name.startsWith('_') // Skip internal functions
    ) {
      if (
        item.stateMutability === 'view' ||
        item.stateMutability === 'pure' ||
        item.constant
      ) {
        readFunctions.push({
          name: item.name,
          inputs: item.inputs || [],
          outputs: item.outputs || [],
        });
      } else {
        writeFunctions.push({
          name: item.name,
          inputs: item.inputs || [],
          payable: item.stateMutability === 'payable',
        });
      }
    }
  }

  // Group functions by category
  const mintFunctions = writeFunctions.filter(
    (func) =>
      func.name.toLowerCase().includes('mint') ||
      func.name.toLowerCase() === 'buy' ||
      func.name.toLowerCase() === 'purchase'
  );

  // If we have mint functions, prioritize them
  return {
    writeFunctions: [
      ...mintFunctions,
      ...writeFunctions.filter(
        (func) => !mintFunctions.some((mint) => mint.name === func.name)
      ),
    ],
    readFunctions,
  };
};

// Function to format ETH values
export const formatEth = (value: bigint | string | number): string => {
  try {
    return ethers.formatEther(value.toString());
  } catch (error) {
    return '0';
  }
};

// Function to parse ETH values
export const parseEth = (value: string): bigint => {
  try {
    return ethers.parseEther(value);
  } catch (error) {
    return BigInt(0);
  }
};

// Function to shorten an address
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Function to estimate gas for a transaction
export const estimateGasForTransaction = async (
  contract: ethers.Contract,
  functionName: string,
  args: any[],
  value: bigint
): Promise<bigint> => {
  try {
    // Ensure the function exists on the contract
    if (!contract[functionName]) {
      throw new Error(`Function ${functionName} does not exist on this contract`);
    }

    // Prepare the transaction for gas estimation
    const tx = {
      to: contract.target,
      data: contract.interface.encodeFunctionData(functionName, args),
      value,
    };

    // Estimate gas
    const gasEstimate = await contract.runner.provider?.estimateGas(tx);
    return gasEstimate || BigInt(0);
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};
