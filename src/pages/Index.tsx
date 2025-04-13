import React, { useState, useEffect } from 'react';
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
import { fetchContractABI, getContractFunctions, parseEth } from '@/lib/contractUtils';
import { v4 as uuidv4 } from 'uuid';

const Index = () => {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Contract state
  const [contractAddress, setContractAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(1);
  const [contractABI, setContractABI] = useState<any[] | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [writeFunctions, setWriteFunctions] = useState<{name: string; inputs: any[]; payable: boolean}[]>([]);
  const [readFunctions, setReadFunctions] = useState<{name: string; inputs: any[]; outputs: any[]}[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingContract, setIsLoadingContract] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedFunctionDetails, setSelectedFunctionDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Get contract from local storage on mount
  useEffect(() => {
    const storedTransactions = localStorage.getItem('nitro-nft-transactions');
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (e) {
        console.error('Failed to parse stored transactions');
      }
    }
    
    // Try to restore last used contract
    const lastContract = localStorage.getItem('nitro-nft-last-contract');
    if (lastContract) {
      try {
        const { address, chainId } = JSON.parse(lastContract);
        if (address && chainId && isConnected) {
          handleLoadContract(address, chainId);
        }
      } catch (e) {
        console.error('Failed to restore last contract');
      }
    }
  }, [isConnected]);
  
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
  const handleLoadContract = async (address: string, chain: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setIsLoadingContract(true);
    
    try {
      const abi = await fetchContractABI(address, chain);
      
      if (!abi) {
        throw new Error('Failed to fetch contract ABI');
      }
      
      // Create contract instance
      const contractInstance = new ethers.Contract(
        address,
        abi,
        walletClient || publicClient
      );
      
      // Extract functions from ABI
      const { writeFunctions, readFunctions } = getContractFunctions(abi);
      
      setContractAddress(address);
      setChainId(chain);
      setContractABI(abi);
      setContract(contractInstance);
      setWriteFunctions(writeFunctions);
      setReadFunctions(readFunctions);
      
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
      
      toast.success('Contract loaded successfully');
    } catch (error) {
      console.error('Error loading contract:', error);
      toast.error('Failed to load contract');
    } finally {
      setIsLoadingContract(false);
    }
  };

  // Handle function execution
  const handleExecuteFunction = async (args: any[], ethValue: string) => {
    if (!contract || !selectedFunction || !selectedFunctionDetails || !walletClient) return;
    
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
      
      // Send transaction
      const tx = await contract[selectedFunction](...processedArgs, options);
      
      // Update transaction record with hash
      setTransactions(prev => 
        prev.map(t => 
          t.id === txId 
            ? { ...t, hash: tx.hash, status: 'pending' } 
            : t
        )
      );
      
      toast.success(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Update transaction status
      setTransactions(prev => 
        prev.map(t => 
          t.id === txId 
            ? { ...t, status: 'success' } 
            : t
        )
      );
      
      toast.success(`Transaction confirmed!`);
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      // Update transaction status
      setTransactions(prev => 
        prev.map(t => 
          t.id === txId 
            ? { ...t, status: 'error' } 
            : t
        )
      );
      
      toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Layout>
      <div className="grid md:grid-cols-7 gap-6">
        {/* Left column: contract inputs and transaction history */}
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
            </CardContent>
          </Card>

          <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
            <CardHeader>
              <CardTitle className="text-lg font-mono">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionHistory transactions={transactions} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: function interaction */}
        <div className="md:col-span-4">
          <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
            <CardHeader>
              <CardTitle className="text-xl font-mono">
                {contractAddress ? (
                  <span>
                    Contract <span className="text-cyber-accent">{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
                  </span>
                ) : (
                  "Contract Interaction"
                )}
              </CardTitle>
              {contractAddress && (
                <CardDescription>
                  {writeFunctions.length} write functions, {readFunctions.length} read functions found
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
                        isLoading={isExecuting}
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
