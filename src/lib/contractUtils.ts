import { ethers } from 'ethers';
import { toast } from 'sonner';

// Function to fetch ABI from contract address using Etherscan-like APIs
export const fetchContractABI = async (
  address: string, 
  chainId: number
): Promise<any[] | null> => {
  console.log(`Fetching ABI for contract ${address} on chain ${chainId}`);
  
  try {
    // First, try direct RPC method call to get the bytecode
    // This can help determine if the contract exists
    const provider = getEthersProvider(chainId);
    const bytecode = await provider.getCode(address);
    
    if (bytecode === '0x' || bytecode === '') {
      console.log('Contract does not exist or is not deployed at this address');
      toast.error('No contract found at this address');
      return null;
    }
    
    // Contract exists, try to get verified ABI from block explorer
    let apiUrl;
    let apiKey;
    
    // Using public API keys for demo purposes
    // These are public keys used for demo and rate-limited, but work for basic usage
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
      case 8453: // Base - use a free API key for testing
        apiUrl = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=YourApiKeyToken`;
        break;
      case 420: // APE - no official explorer API yet, use fallback
        console.log('No block explorer API available for ApeCoin chain, using fallback ABI');
        return getSmartDetectedABI(bytecode);
      default:
        console.log('No block explorer API available for this chain, using smart detection');
        return getSmartDetectedABI(bytecode);
    }

    if (!apiUrl) {
      console.log('No block explorer API available for this chain, using fallback ABI');
      return getSmartDetectedABI(bytecode);
    }

    console.log('Fetching ABI from explorer API:', apiUrl);
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log('Explorer API response:', data);

    if (data.status === '1' && data.result) {
      try {
        // Try to parse the ABI
        const abi = JSON.parse(data.result);
        console.log('Successfully fetched verified ABI:', abi);
        return abi;
      } catch (parseError) {
        console.error('Error parsing ABI:', parseError);
        return getSmartDetectedABI(bytecode);
      }
    } else {
      console.log('Contract not verified or API key issue, using smart detection');
      console.log('API error message:', data.message || 'Unknown error');
      
      // If there's an API key error, let the user know
      if (data.message && data.message.includes('API Key')) {
        toast.warning("Block explorer API key issue - using fallback ABI detection");
      }
      
      return getSmartDetectedABI(bytecode);
    }
  } catch (error) {
    console.error("Error fetching contract ABI:", error);
    toast.error("Failed to fetch contract ABI. Using a generic ABI instead.");
    return getFallbackABI();
  }
};

// New function to attempt more intelligent ABI detection based on bytecode
function getSmartDetectedABI(bytecode: string) {
  console.log('Using smart ABI detection...');
  
  // Check for ERC721 signature in bytecode
  const isLikelyERC721 = bytecode.includes('80ac58cd') || // ERC721 interface ID
                          bytecode.includes('5b5e139f') || // ERC721Metadata interface ID
                          bytecode.includes('780e9d63'); // ERC721Enumerable interface ID
  
  // Check for ERC20 signature in bytecode
  const isLikelyERC20 = bytecode.includes('36372b07') || // ERC20 interface ID
                         bytecode.includes('06fdde03') && // name()
                         bytecode.includes('95d89b41') && // symbol()
                         bytecode.includes('18160ddd'); // totalSupply()
  
  // Check for ERC1155 signature
  const isLikelyERC1155 = bytecode.includes('d9b67a26'); // ERC1155 interface ID
  
  if (isLikelyERC721) {
    console.log('Detected: Likely ERC721 NFT contract');
    toast.info("Detected as NFT contract - using ERC721 functions");
    return getERC721ABI();
  } else if (isLikelyERC1155) {
    console.log('Detected: Likely ERC1155 contract');
    toast.info("Detected as multi-token contract - using ERC1155 functions");
    return getERC1155ABI();
  } else if (isLikelyERC20) {
    console.log('Detected: Likely ERC20 token contract');
    toast.info("Detected as token contract - using ERC20 functions");
    return getERC20ABI();
  }
  
  // If we can't determine the type, return a combined fallback ABI
  console.log('Could not determine specific contract type, using combined fallback ABI');
  toast.info("Using generic contract interface - functions may be limited");
  return getFallbackABI();
}

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

// Function specifically for ERC721 contracts
function getERC721ABI() {
  return [
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
    
    // Common mint functions with different signatures for compatibility
    "function mint(uint256 tokenId) payable",
    "function mint(uint256 amount) payable",
    "function mint(address to, uint256 tokenId) payable",
    "function mint(address to, uint256 amount, string uri) payable",
    "function mintNFT(address recipient) returns (uint256)",
    "function mintNFT(address recipient, uint256 tokenId) returns (uint256)",
    "function mintNFT(address recipient, string memory tokenURI) returns (uint256)",
    "function mintTo(address to) payable",
    "function mintTo(address to, uint256 amount) payable",
    "function publicMint(uint256 amount) payable",
    "function publicMint(uint256 quantity, uint256 maxQuantity) payable",
    "function presaleMint(uint256 amount, bytes32[] proof) payable",
    "function whitelistMint(uint256 quantity, bytes32[] calldata proof) payable",
    
    // Common NFT view functions
    "function totalSupply() view returns (uint256)",
    "function maxSupply() view returns (uint256)",
    "function cost() view returns (uint256)",
    "function mintPrice() view returns (uint256)",
    "function maxMintAmount() view returns (uint256)",
    "function tokensMinted() view returns (uint256)",
    "function paused() view returns (bool)",
    "function revealed() view returns (bool)",
    "function saleIsActive() view returns (bool)",
    "function presaleIsActive() view returns (bool)",
    "function whitelistMintEnabled() view returns (bool)",
    
    // Common owner functions (for completeness)
    "function withdraw() payable",
    "function setBaseURI(string memory baseURI)",
    "function setPrice(uint256 _price)",
    "function setMaxMintAmount(uint256 _maxMintAmount)",
    "function setPaused(bool _paused)",
    "function setSaleIsActive(bool _saleIsActive)",
    "function setPresaleIsActive(bool _presaleIsActive)",
  ];
}

// Function specifically for ERC20 contracts
function getERC20ABI() {
  return [
    // ERC20 Standard
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    
    // Common ERC20 extensions
    "function mint(address to, uint256 amount)",
    "function burn(uint256 amount)",
    "function burnFrom(address account, uint256 amount)",
    "function cap() view returns (uint256)",
    "function pause()",
    "function unpause()",
    "function paused() view returns (bool)",
    "function snapshot() returns (uint256)",
    "function getCurrentSnapshotId() view returns (uint256)",
    "function balanceOfAt(address account, uint256 snapshotId) view returns (uint256)",
    "function totalSupplyAt(uint256 snapshotId) view returns (uint256)",
  ];
}

// Function specifically for ERC1155 contracts
function getERC1155ABI() {
  return [
    // ERC1155 Standard
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) view returns (uint256[] memory)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address account, address operator) view returns (bool)",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data)",
    "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)",
    
    // Common ERC1155 extensions
    "function uri(uint256 id) view returns (string memory)",
    "function name() view returns (string memory)",
    "function symbol() view returns (string memory)",
    
    // Common mint functions
    "function mint(address to, uint256 id, uint256 amount, bytes memory data)",
    "function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)",
    "function create(uint256 initialSupply, string calldata uri)",
    "function mint(uint256 tokenId, uint256 amount) payable",
    "function mintTo(address to, uint256 id, uint256 amount) payable",
    "function mintForAddress(address to, uint256 id, uint256 amount)",
    
    // Common view functions
    "function exists(uint256 id) view returns (bool)",
    "function totalSupply(uint256 id) view returns (uint256)",
    "function maxSupply(uint256 id) view returns (uint256)",
    "function cost() view returns (uint256)",
    "function paused() view returns (bool)",
  ];
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

// Helper function to get an Ethers provider based on chain ID
function getEthersProvider(chainId: number): ethers.Provider {
  switch (chainId) {
    case 1:
      return new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 5:
      return new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 11155111:
      return new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 137:
      return new ethers.providers.JsonRpcProvider('https://polygon-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 80001:
      return new ethers.providers.JsonRpcProvider('https://mumbai.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 42161:
      return new ethers.providers.JsonRpcProvider('https://arb-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 10:
      return new ethers.providers.JsonRpcProvider('https://optimism-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 56:
      return new ethers.providers.JsonRpcProvider('https://bsc-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 8453:
      return new ethers.providers.JsonRpcProvider('https://base-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    case 420:
      return new ethers.providers.JsonRpcProvider('https://ape-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}
