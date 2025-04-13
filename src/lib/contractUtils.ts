
import { ethers } from 'ethers';
import { toast } from 'sonner';

// Function to fetch ABI from contract address using Etherscan-like APIs
export const fetchContractABI = async (
  address: string, 
  chainId: number
): Promise<any[] | null> => {
  try {
    // For a production app, you would use Etherscan or similar API
    // For this demo, we'll try to detect the ERC721 standard functions
    
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

    // Return the basic ABI as a fallback
    // Note: In a production app, you would fetch the verified ABI from Etherscan
    return basicERC721ABI;
  } catch (error) {
    console.error("Error fetching contract ABI:", error);
    toast.error("Failed to fetch contract ABI. Please check the address.");
    return null;
  }
};

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
        const inputs = parsed.inputs.map(input => ({
          name: input.name || '',
          type: input.type,
        }));
        
        if (parsed.constant || parsed.stateMutability === 'view' || parsed.stateMutability === 'pure') {
          readFunctions.push({
            name,
            inputs,
            outputs: parsed.outputs || [],
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

  // Filter out likely mint functions for easy access
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
