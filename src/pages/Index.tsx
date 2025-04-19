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
import ScheduledTransactions from '@/components/ScheduledTransactions';
import { scheduleTransaction, cancelScheduledTransaction } from '@/lib/timerUtils';
import MerkleProofGenerator from '@/components/MerkleProofGenerator';

type EthersContract = ethers.Contract & {
  [key: string]: any;
};

const Index = () => {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [contractAddress, setContractAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(1);
  const [contractABI, setContractABI] = useState<any[] | null>(null);
  const [contract, setContract] = useState<EthersContract | null>(null);
  const [writeFunctions, setWriteFunctions] = useState<{name: string; inputs: any[]; payable: boolean}[]>([]);
  const [readFunctions, setReadFunctions] = useState<{name: string; inputs: any[]; outputs: any[]}[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingContract, setIsLoadingContract] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedFunctionDetails, setSelectedFunctionDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contractName, setContractName] = useState<string | null>(null);
  
  const [privateKeySigner, setPrivateKeySigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    const storedTransactions = localStorage.getItem('nitro-nft-transactions');
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (e) {
        console.error('Failed to parse stored transactions');
      }
    }
    
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
    
    window.addEventListener('privateKeyConnected', ((event: CustomEvent) => {
      console.log('Private key connected event received');
      if (event.detail && event.detail.signer) {
        setPrivateKeySigner(event.detail.signer);
      }
    }) as EventListener);
    
    return () => {
      window.removeEventListener('privateKeyConnected', (() => {}) as EventListener);
      
      import('@/lib/timerUtils').then(({ clearAllScheduledTransactions }) => {
        clearAllScheduledTransactions();
      });
    };
  }, []);
  
  useEffect(() => {
    localStorage.setItem('nitro-nft-transactions', JSON.stringify(transactions));
  }, [transactions]);
  
  useEffect(() => {
    if (selectedFunction && writeFunctions.length > 0) {
      const funcDetails = writeFunctions.find(f => f.name === selectedFunction);
      setSelectedFunctionDetails(funcDetails);
    } else {
      setSelectedFunctionDetails(null);
    }
  }, [selectedFunction, writeFunctions]);

  const handleLoadContract = useCallback(async (address: string, chain: number) => {
    setIsLoadingContract(true);
    
    try {
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
      
      const provider = getEthersProvider(chain);
      
      const contractInstance = new ethers.Contract(address, abi, provider) as EthersContract;
      
      let name = 'Unknown Contract';
      try {
        name = await contractInstance.name();
        console.log('Contract name:', name);
      } catch (e) {
        console.log('Could not fetch contract name');
        try {
          name = await contractInstance.Name();
        } catch (e) {
          console.log('Could not fetch contract name using alternative method');
        }
      }
      
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
      
      localStorage.setItem('nitro-nft-last-contract', JSON.stringify({ address, chainId: chain }));
      
      toast.success(`Contract loaded: ${name || 'Unknown Contract'}`);
    } catch (error: any) {
      console.error('Error loading contract:', error);
      toast.error(`Failed to load contract: ${error.message || 'Unknown error'}`);
      
      setContract(null);
      setWriteFunctions([]);
      setReadFunctions([]);
    } finally {
      setIsLoadingContract(false);
    }
  }, []);

  const handleExecuteFunction = useCallback(async (args: any[], ethValue: string) => {
    if (!contract || !selectedFunction || !selectedFunctionDetails) {
      toast.error('Contract not loaded or function not selected');
      return;
    }
    
    const hasValidSigner = privateKeySigner !== null;
    
    if (!hasValidSigner) {
      toast.error('Please connect using a private key to execute transactions');
      return;
    }
    
    setIsExecuting(true);
    
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
    
    setTransactions(prev => [newTx, ...prev]);
    
    try {
      const processedArgs = args.map((arg, index) => {
        const paramType = selectedFunctionDetails.inputs[index].type;
        
        if (paramType.startsWith('uint') || paramType.startsWith('int')) {
          return BigInt(arg);
        }
        
        return arg;
      });
      
      const options: {value?: bigint} = {};
      if (selectedFunctionDetails.payable && parseFloat(ethValue) > 0) {
        options.value = parseEth(ethValue);
      }
      
      let executionContract = contract;
      if (privateKeySigner) {
        executionContract = contract.connect(privateKeySigner) as EthersContract;
      }
      
      console.log('Sending transaction:', {
        function: selectedFunction,
        args: processedArgs,
        options
      });
      
      const tx = await executionContract[selectedFunction](...processedArgs, options);
      
      setTransactions(prev => 
        prev.map(t => 
          t.id === txId 
            ? { ...t, hash: tx.hash, status: 'pending' } 
            : t
        )
      );
      
      toast.success(`Transaction sent: ${tx.hash}`);
      
      toast.info('Waiting for transaction confirmation...');
      
      tx.wait().then((receipt: any) => {
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
    
    const executionCallback = async () => {
      return handleExecuteFunction(args, value);
    };
    
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

          <MerkleProofGenerator />

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
