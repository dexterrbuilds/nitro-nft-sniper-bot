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
import { fetchContractABI, getContractFunctions, parseEth, shortenAddress } from '@/lib/contractUtils';
import { v4 as uuidv4 } from 'uuid';
import { getEthersProvider } from '@/lib/web3Config';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PrivateKeyInput from '@/components/PrivateKeyInput';
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
  const [chainId, setChainId] = useState<number>(1);
  const [contractABI, setContractABI] = useState<any[] | null>(null);
  const [contract, setContract] = useState<EthersContract | null>(null);
  const [writeFunctions, setWriteFunctions] = useState<{name: string; inputs: any[]; payable: boolean}[]>([]);
  const [readFunctions, setReadFunctions] = useState<{name: string; inputs: any[]; outputs: any[]}[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingContract, setIsLoadingContract] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
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
    
    return () => {
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
  
  // Update selected function details when a function is selected
  useEffect(() => {
    if (selectedFunction && writeFunctions.length > 0) {
      const funcDetails = writeFunctions.find(f => f.name === selectedFunction);
      setSelectedFunctionDetails(funcDetails);
    } else {
      setSelectedFunctionDetails(null);
    }
  }, [selectedFunction, writeFunctions]);

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
      
      // Select a default function if available (preferably a mint function)
      const mintFunction = writeFunctions.find(f => 
        f.name.toLowerCase().includes('mint') || 
        f.name.toLowerCase() === 'buy' || 
        f.name.toLowerCase() === 'purchase'
      );
      
      if (mintFunction) {
        setSelectedFunction(mintFunction.name);
      } else if (writeFunctions.length > 0) {
        setSelectedFunction(writeFunctions[0].name);
      }
      
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

  // Handle function execution - updated to use privateKeySigner if available
  const handleExecuteFunction = useCallback(async (args: any[], ethValue: string) => {
    if (!contract || !selectedFunction || !selectedFunctionDetails) {
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
      functionName: selectedFunction,
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
      
      // Create transaction options with value if needed
      const options: {value?: bigint} = {};
      if (selectedFunctionDetails.payable && parseFloat(ethValue) > 0) {
        options.value = parseEth(ethValue);
      }
      
      // Use private key signer if available
      let executionContract = contract;
      if (privateKeySigner) {
        executionContract = contract.connect(privateKeySigner) as EthersContract;
      }
      
      // Log transaction details for debugging
      console.log('Sending transaction:', {
        function: selectedFunction,
        args: processedArgs,
        options
      });
      
      // Send transaction with properly typed contract
      const tx = await executionContract[selectedFunction](...processedArgs, options);
      
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
        
        toast.success(`Transaction confirmed!`);
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
  }, [contract, selectedFunction, selectedFunctionDetails, privateKeySigner, contractAddress]);

  // Schedule a transaction for later execution
  const handleScheduleTransaction = useCallback((
    id: string, 
    scheduledTime: number, 
    args: any[], 
    value: string
  ) => {
    if (!contract || !selectedFunction || !selectedFunctionDetails || !privateKeySigner) {
      toast.error('Contract not loaded, function not selected, or wallet not connected');
      return;
    }
    
    // Create a callback function to execute at the scheduled time
    const executionCallback = async () => {
      // This will run when the scheduled time is reached
      return handleExecuteFunction(args, value);
    };
    
    // Schedule the transaction
    scheduleTransaction({
      id,
      functionName: selectedFunction,
      contractAddress: contractAddress,
      args,
      value,
      scheduledTime,
      executionCallback
    });
  }, [contract, selectedFunction, selectedFunctionDetails, privateKeySigner, contractAddress, handleExecuteFunction]);

  // New function to handle private key connection
  const handlePrivateKeyConnect = (address: string) => {
    // The signer is already set in the web3Config.ts via an event
    // Just update the UI to reflect the connection
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
                Enter an NFT contract address to interact with its functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractInputForm 
                onSubmit={handleLoadContract}
                isLoading={isLoadingContract}
              />
              
              <div className="mt-6">
                <PrivateKeyInput onConnect={handlePrivateKeyConnect} />
              </div>
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
                      onSelect={setSelectedFunction}
                      selectedFunction={selectedFunction}
                    />
                    
                    {selectedFunction && selectedFunctionDetails && (
                      <FunctionForm 
                        functionName={selectedFunction}
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
