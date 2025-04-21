import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import ContractInputForm from '@/components/ContractInputForm';
import FunctionSelector from '@/components/FunctionSelector';
import FunctionForm from '@/components/FunctionForm';
import TransactionHistory, { Transaction } from '@/components/TransactionHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  fetchContractABI, 
  getContractFunctions, 
  parseEth, 
  shortenAddress, 
  getFullFunctionSignature 
} from '@/lib/contractUtils';
import { v4 as uuidv4 } from 'uuid';
import { getEthersProvider, chainOptions } from '@/lib/web3Config';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ScheduledTransactions from '@/components/ScheduledTransactions';
import { scheduleTransaction, cancelScheduledTransaction } from '@/lib/timerUtils';

// Define a more specific type that allows indexing by string
type EthersContract = ethers.Contract & {
  [key: string]: any;
};

const Index = () => {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Contract state
  const [contractAddress, setContractAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(16384); // Default to Ape Chain
  const [contractABI, setContractABI] = useState<any[] | null>(null);
  const [contract, setContract] = useState<EthersContract | null>(null);
  const [writeFunctions, setWriteFunctions] = useState<{name: string; inputs: any[]; payable: boolean}[]>([]);
  const [readFunctions, setReadFunctions] = useState<{name: string; inputs: any[]; outputs: any[]}[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingContract, setIsLoadingContract] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  
  // The selectedFunction is now the full function signature, not just the name
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedFunctionDetails, setSelectedFunctionDetails] = useState<any>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contractName, setContractName] = useState<string | null>(null);
  
  // Add state for private key connected signer
  const [privateKeySigner, setPrivateKeySigner] = useState<ethers.Signer | null>(null);
  
  // Get contract from local storage on mount and set up storage listeners
  useEffect(() => {
    const storedTransactions = localStorage.getItem('nitro-nft-transactions');
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (e) {
        console.error('Failed to parse stored transactions');
      }
    }
    
    // Try to load the last contract if available
    const lastContract = localStorage.getItem('nitro-nft-last-contract');
    if (lastContract) {
      try {
        const { address, chainId } = JSON.parse(lastContract);
        if (address && chainId) {
          console.log('Loading last used contract:', address, 'on chain', chainId);
          handleLoadContract(address, chainId);
        }
      } catch (e) {
        console.error('Failed to load last contract', e);
      }
    }
    
    // Set up an event listener for privateKeySigner updates from web3Config
    window.addEventListener('privateKeyConnected', ((event: CustomEvent) => {
      console.log('Private key connected event received');
      if (event.detail && event.detail.signer) {
        setPrivateKeySigner(event.detail.signer);
      }
    }) as EventListener);
    
    return () => {
      // Remove event listener
      window.removeEventListener('privateKeyConnected', (() => {}) as EventListener);
      
      // Clean up scheduled transactions when component unmounts
      import('@/lib/timerUtils').then(({ clearAllScheduledTransactions }) => {
        clearAllScheduledTransactions();
      });
    };
  }, []);
  
  // Save transactions to local storage when they change
  useEffect(() => {
    localStorage.setItem('nitro-nft-transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Handle loading contract data
  const handleLoadContract = useCallback(async (address: string, chain: number) => {
    setIsLoadingContract(true);
    
    try {
      // Reset state first
      setContractABI(null);
      setContract(null);
      setWriteFunctions([]);
      setReadFunctions([]);
      setSelectedFunction(null);
      setSelectedFunctionDetails(null);
      
      console.log(`Loading contract ${address} on chain ${chain}`);
      
      const abi = await fetchContractABI(address, chain);
      
      if (!abi) {
        throw new Error('Failed to fetch contract ABI');
      }
      
      // Create a read-only provider for the selected chain
      const provider = getEthersProvider(chain);
      
      // Create contract instance with read-only provider
      const contractInstance = new ethers.Contract(address, abi, provider) as EthersContract;
      
      // Try to fetch contract name
      let name = 'Unknown Contract';
      try {
        name = await contractInstance.name();
        console.log('Contract name:', name);
      } catch (e) {
        console.log('Could not fetch contract name');
        // Try alternative method
        try {
          // Some contracts use a different case for the name function
          name = await contractInstance.Name();
        } catch (e) {
          console.log('Could not fetch contract name using alternative method');
        }
      }
      
      // Extract functions from ABI
      const { writeFunctions, readFunctions } = getContractFunctions(abi);
      console.log('Write functions:', writeFunctions);
      console.log('Read functions:', readFunctions);
      
      setContractAddress(address);
      setChainId(chain);
      setContractABI(abi);
      setContract(contractInstance);
      setWriteFunctions(writeFunctions);
      setReadFunctions(readFunctions);
      setContractName(name);
      
      // Save to local storage
      localStorage.setItem('nitro-nft-last-contract', JSON.stringify({ address, chainId: chain }));
      
      toast.success(`Contract loaded: ${name || 'Unknown Contract'}`);
    } catch (error: any) {
      console.error('Error loading contract:', error);
      toast.error(`Failed to load contract: ${error.message || 'Unknown error'}`);
      
      // Clear contract-related state
      setContract(null);
      setWriteFunctions([]);
      setReadFunctions([]);
    } finally {
      setIsLoadingContract(false);
    }
  }, []);

  // This function is now called with signature and details
  const handleSelectFunction = (signature: string, details: any) => {
    console.log("Selected function:", signature, details);
    setSelectedFunction(signature);
    setSelectedFunctionDetails(details);
  };

  const handleExecuteFunction = useCallback(async (signature: string, args: any[], ethValue: string) => {
    if (!contract || !signature || !selectedFunctionDetails) {
      toast.error('Contract not loaded or function not selected');
      return;
    }
    
    // Check if we have a private key signer
    const hasValidSigner = privateKeySigner !== null;
    
    if (!hasValidSigner) {
      toast.error('Please connect using a private key to execute transactions');
      return;
    }
    
    setIsExecuting(true);
    
    // Create a transaction record
    const txId = uuidv4();
    const newTx: Transaction = {
      id: txId,
      hash: '',
      functionName: selectedFunctionDetails.name,
      contractAddress: contractAddress,
      value: ethValue,
      status: 'pending',
      timestamp: Date.now(),
    };
    
    // Add to transaction history
    setTransactions(prev => [newTx, ...prev]);
    
    try {
      // Convert parameters to the right types
      const processedArgs = args.map((arg, index) => {
        const paramType = selectedFunctionDetails.inputs[index].type;
        
        // Specific type conversions
        if (paramType.startsWith('uint') || paramType.startsWith('int')) {
          return BigInt(arg);
        }
        
        return arg;
      });
      
      // Get a provider specifically for the current chain (defaults to Ape Chain)
      // Use chainId from the current state, which is set when the contract is loaded
      const targetChainId = chainId; // This will be either Base (8453) or Ape Chain (16384)
      const targetProvider = getEthersProvider(targetChainId);
      
      // Create a new contract instance with the target chain signer
      // Connect the private key signer to the target chain
      const targetSigner = privateKeySigner.connect(targetProvider);
      
      // Create a new contract instance with the signer
      const executionContract = new ethers.Contract(
        contractAddress,
        contractABI,
        targetSigner
      ) as EthersContract;
      
      // Parse ETH value properly
      let value = BigInt(0);
      if (selectedFunctionDetails.payable && ethValue) {
        try {
          value = parseEth(ethValue);
          console.log(`Transaction value: ${ethValue} ETH (${value} wei)`);
        } catch (error) {
          console.error('Error parsing ETH value:', error);
          toast.error('Invalid ETH amount');
          setIsExecuting(false);
          
          // Update transaction status
          setTransactions(prev => 
            prev.map(t => 
              t.id === txId 
                ? { ...t, status: 'error', error: 'Invalid ETH amount' } 
                : t
            )
          );
          
          return;
        }
      }
      
      // Get current gas price from the network
      const feeData = await targetProvider.getFeeData();
      
      // Set reasonable gas parameters - using current network conditions but with reasonable limits
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? 
        feeData.maxPriorityFeePerGas : 
        ethers.parseUnits("1.5", "gwei"); // Default to 1.5 gwei if can't get from network
      
      const maxFeePerGas = feeData.maxFeePerGas ?
        feeData.maxFeePerGas :
        maxPriorityFeePerGas + ethers.parseUnits("2", "gwei"); // Base fee + priority fee
      
      // Prepare transaction options with explicit gas parameters
      const options = {
        value: value,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: maxFeePerGas,
        // Set gas limit with a reasonable value or estimate it
        gasLimit: 300000, // A reasonable default, can be adjusted based on the contract function
      };
      
      // Log transaction details for debugging
      console.log('Sending transaction:', {
        function: signature,
        args: processedArgs,
        value: ethers.formatEther(value) + ' ETH',
        maxPriorityFeePerGas: ethers.formatUnits(maxPriorityFeePerGas, "gwei") + ' gwei',
        maxFeePerGas: ethers.formatUnits(maxFeePerGas, "gwei") + ' gwei',
        chainId: targetChainId,
        network: targetChainId === 8453 ? 'Base' : 'Ape Chain'
      });
      
      // Confirm with user if the value is high
      if (value > parseEth("1.0")) { // Confirm if sending more than 1 ETH
        if (!window.confirm(`You are about to send ${ethers.formatEther(value)} ETH. Are you sure?`)) {
          toast.info('Transaction cancelled by user');
          setIsExecuting(false);
          
          // Update transaction status
          setTransactions(prev => 
            prev.map(t => 
              t.id === txId 
                ? { ...t, status: 'cancelled' } 
                : t
            )
          );
          
          return;
        }
      }
      
      // Send transaction using the SIGNATURE as the key instead of just the function name
      const tx = await executionContract[signature](...processedArgs, options);
      
      // Update transaction record with hash
      setTransactions(prev => 
        prev.map(t => 
          t.id === txId 
            ? { ...t, hash: tx.hash, status: 'pending' } 
            : t
        )
      );
      
      toast.success(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation (but don't freeze the UI)
      toast.info('Waiting for transaction confirmation...');
      
      // We use the await but in a non-blocking way
      tx.wait().then((receipt: any) => {
        // Update transaction status
        setTransactions(prev => 
          prev.map(t => 
            t.id === txId 
              ? { ...t, status: 'success' } 
              : t
          )
        );
        
        toast.success(`Transaction confirmed on ${targetChainId === 8453 ? 'Base' : 'Ape Chain'}!`);
      }).catch((error: any) => {
        console.error('Transaction confirmation error:', error);
        
        // Update transaction status
        setTransactions(prev => 
          prev.map(t => 
            t.id === txId 
              ? { ...t, status: 'error' } 
              : t
            )
        );
        
        toast.error(`Transaction failed during confirmation`);
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      // Update transaction status
      setTransactions(prev => 
        prev.map(t => 
          t.id === txId 
            ? { ...t, status: 'error', error: error.message } 
            : t
        )
      );
      
      toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  }, [contract, contractAddress, contractABI, selectedFunctionDetails, privateKeySigner, chainId]);

  // Schedule a transaction for later execution
  const handleScheduleTransaction = useCallback((
    id: string, 
    scheduledTime: number, 
    signature: string,
    args: any[], 
    value: string
  ) => {
    if (!contract || !signature || !selectedFunctionDetails || !privateKeySigner) {
      toast.error('Contract not loaded, function not selected, or wallet not connected');
      return;
    }
    
    // Create a callback function to execute at the scheduled time
    const executionCallback = async () => {
      // This will run when the scheduled time is reached
      return handleExecuteFunction(signature, args, value);
    };
    
    // Schedule the transaction
    scheduleTransaction({
      id,
      functionName: selectedFunctionDetails.name,
      contractAddress: contractAddress,
      args,
      value,
      scheduledTime,
      executionCallback
    });
  }, [contract, selectedFunctionDetails, privateKeySigner, contractAddress, handleExecuteFunction]);

  // Handle private key connection - moved this functionality to ConnectWallet.tsx
  const handlePrivateKeyConnect = (address: string) => {
    toast.success(`Connected with address: ${shortenAddress(address)}`);
  };

  return (
    <Layout>
      <div className="grid md:grid-cols-7 gap-6">
        <div className="md:col-span-3 space-y-6">
          <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
            <CardHeader>
              <CardTitle className="text-xl font-mono cyber-glow-text">NFT Sniper Bot</CardTitle>
              <CardDescription>
                Enter an NFT contract address to interact with its functions.
                <span className="block mt-1 text-cyber-accent">Using {chainId === 8453 ? 'Base' : 'Ape Chain'}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractInputForm 
                onSubmit={handleLoadContract}
                isLoading={isLoadingContract}
              />
            </CardContent>
          </Card>

          <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
            <CardHeader>
              <CardTitle className="text-lg font-mono">Transaction History</CardTitle>
              {!privateKeySigner && (
                <CardDescription className="text-amber-500">
                  Connect with private key to execute transactions
                </CardDescription>
              )}
              {privateKeySigner && (
                <CardDescription className="text-green-500">
                  Connected with private key
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <TransactionHistory transactions={transactions} />
              <ScheduledTransactions />
            </CardContent>
          </Card>
        </div>

        {/* Right column: function interaction */}
        <div className="md:col-span-4">
          <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
            <CardHeader>
              <CardTitle className="text-xl font-mono">
                {contractAddress ? (
                  <div className="flex items-center gap-2">
                    <span>
                      {contractName || 'Contract'}{' '}
                      <span className="text-cyber-accent">
                        {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                      </span>
                    </span>
                    {contractName && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={16} className="text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Contract Name: {contractName}</p>
                            <p>Address: {contractAddress}</p>
                            <p>Network: {chainId === 8453 ? 'Base Chain' : 'Ape Chain'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ) : (
                  "Contract Interaction"
                )}
              </CardTitle>
              {contractAddress && (
                <CardDescription>
                  {writeFunctions.length} write functions, {readFunctions.length} read functions found
                  {!privateKeySigner && (
                    <span className="block mt-1 text-amber-500">
                      Connect with private key to execute functions
                    </span>
                  )}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!contractAddress ? (
                <div className="p-6 text-center border border-dashed border-muted rounded-md">
                  <p className="text-muted-foreground">
                    Enter a contract address to get started
                  </p>
                </div>
              ) : (
                <Tabs defaultValue="write" className="space-y-4">
                  <TabsList className="grid grid-cols-2 bg-cyber-dark border border-cyber-accent/30">
                    <TabsTrigger value="write" className="font-mono">Write Functions</TabsTrigger>
                    <TabsTrigger value="read" className="font-mono">Read Functions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="write" className="space-y-4">
                    <FunctionSelector 
                      functions={writeFunctions}
                      onSelect={handleSelectFunction}
                      selectedFunction={selectedFunction}
                    />
                    
                    {selectedFunction && selectedFunctionDetails && (
                      <FunctionForm 
                        functionSignature={selectedFunction}
                        functionDetails={selectedFunctionDetails}
                        onSubmit={handleExecuteFunction}
                        onSchedule={handleScheduleTransaction}
                        isLoading={isExecuting}
                        walletRequired={true}
                        walletConnected={!!privateKeySigner}
                        contractAddress={contractAddress}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="read">
                    <div className="cyber-panel bg-cyber-dark/50 p-3 text-sm">
                      <p className="text-muted-foreground italic">
                        Read functions coming soon...
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
