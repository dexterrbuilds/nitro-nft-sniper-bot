
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Shield, TrendingUp, Key, Search, AlertTriangle } from 'lucide-react';
import TransactionHistory, { Transaction } from '@/components/TransactionHistory';
import ConnectWallet from '@/components/ConnectWallet';
import ContractInputForm from '@/components/ContractInputForm';
import FunctionSelector from '@/components/FunctionSelector';
import FunctionForm from '@/components/FunctionForm';
import { fetchContractABI, getContractFunctions, isValidAddress } from '@/lib/contractUtils';
import { getPrivateKeySigner } from '@/lib/web3Config';

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [contractABI, setContractABI] = useState<any[] | null>(null);
  const [contractFunctions, setContractFunctions] = useState<{ writeFunctions: any[]; readFunctions: any[] }>({ writeFunctions: [], readFunctions: [] });
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedFunctionDetails, setSelectedFunctionDetails] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Mock real-time transaction updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(prev => prev.map(tx => {
        if (tx.status === 'pending' && Math.random() > 0.7) {
          return {
            ...tx,
            status: Math.random() > 0.2 ? 'success' : 'error' as const,
            error: Math.random() > 0.2 ? undefined : 'Gas estimation failed'
          };
        }
        return tx;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Listen for private key connection events
  useEffect(() => {
    const handlePrivateKeyConnected = (event: CustomEvent) => {
      if (event.detail && event.detail.signer) {
        const signer = event.detail.signer;
        signer.getAddress().then((address: string) => {
          setIsConnected(true);
          setWalletAddress(address);
          toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        });
      }
    };

    window.addEventListener('privateKeyConnected', handlePrivateKeyConnected as EventListener);
    
    return () => {
      window.removeEventListener('privateKeyConnected', handlePrivateKeyConnected as EventListener);
    };
  }, []);

  const handleAnalyzeContract = async (address: string, chainId: number) => {
    if (!isValidAddress(address)) {
      toast.error('Invalid contract address');
      return;
    }

    setIsAnalyzing(true);
    setContractAddress(address);
    
    try {
      toast.info('Analyzing contract...');
      const abi = await fetchContractABI(address, chainId);
      
      if (abi) {
        setContractABI(abi);
        const functions = getContractFunctions(abi);
        setContractFunctions(functions);
        
        toast.success(`Contract analyzed! Found ${functions.writeFunctions.length} write functions and ${functions.readFunctions.length} read functions`);
      } else {
        toast.error('Failed to fetch contract ABI');
        setContractABI(null);
        setContractFunctions({ writeFunctions: [], readFunctions: [] });
      }
    } catch (error) {
      console.error('Error analyzing contract:', error);
      toast.error('Error analyzing contract');
      setContractABI(null);
      setContractFunctions({ writeFunctions: [], readFunctions: [] });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFunctionSelect = (signature: string, functionDetails: any) => {
    setSelectedFunction(signature);
    setSelectedFunctionDetails(functionDetails);
  };

  const handleFunctionExecute = async (signature: string, args: any[], value: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const signer = getPrivateKeySigner();
    if (!signer) {
      toast.error('No wallet connected');
      return;
    }

    setIsExecuting(true);
    
    try {
      const mockTx: Transaction = {
        id: `tx-${Date.now()}`,
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        functionName: selectedFunctionDetails?.name || 'unknown',
        contractAddress: contractAddress,
        value: value,
        status: 'pending',
        timestamp: Date.now(),
      };
      
      setTransactions(prev => [mockTx, ...prev]);
      toast.info(`Transaction submitted: ${selectedFunctionDetails?.name}`);
      
      // Simulate transaction processing
      setTimeout(() => {
        setTransactions(prev => prev.map(tx => 
          tx.id === mockTx.id 
            ? { ...tx, status: Math.random() > 0.2 ? 'success' : 'error' as const }
            : tx
        ));
      }, 3000);
      
    } catch (error) {
      console.error('Transaction failed:', error);
      toast.error('Transaction failed');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-darker cyber-grid">
      {/* Header */}
      <header className="border-b border-cyber-accent-purple/20 bg-cyber-dark/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap className="w-8 h-8 text-cyber-accent-purple" />
                <div className="absolute inset-0 animate-pulse-neon rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-mono cyber-glow-text">
                  NITRO<span className="text-cyber-secondary">NFT</span>
                </h1>
                <p className="text-xs text-cyber-text-muted font-mono">
                  Next-Gen Contract Interaction
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-cyber-accent-purple/50 text-cyber-accent-purple animate-glow">
                <Activity className="w-3 h-3 mr-1" />
                ACTIVE
              </Badge>
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="cyber-panel">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyber-text-muted">Total Transactions</p>
                    <p className="text-2xl font-bold text-cyber-accent-purple">{transactions.length}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-cyber-accent-purple" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="cyber-panel">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyber-text-muted">Success Rate</p>
                    <p className="text-2xl font-bold text-cyber-secondary">
                      {transactions.length > 0 
                        ? Math.round((transactions.filter(tx => tx.status === 'success').length / transactions.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-cyber-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="cyber-panel">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyber-text-muted">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {transactions.filter(tx => tx.status === 'pending').length}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="cyber-panel">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyber-text-muted">Gas Saved</p>
                    <p className="text-2xl font-bold text-green-400">15.3%</p>
                  </div>
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contract Analysis Panel */}
          <div className="lg:col-span-2">
            <Card className="cyber-panel cyber-border-animated">
              <CardHeader>
                <CardTitle className="cyber-glow-text">Contract Interaction</CardTitle>
                <CardDescription className="text-cyber-text-muted">
                  Analyze smart contracts and execute functions with optimized gas usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contract Input */}
                <ContractInputForm 
                  onSubmit={handleAnalyzeContract}
                  isLoading={isAnalyzing}
                />

                {/* Function Selection */}
                {contractABI && contractFunctions.writeFunctions.length > 0 && (
                  <div className="space-y-4">
                    <FunctionSelector
                      functions={contractFunctions.writeFunctions}
                      onSelect={handleFunctionSelect}
                      selectedFunction={selectedFunction}
                    />

                    {/* Function Execution Form */}
                    {selectedFunction && selectedFunctionDetails && (
                      <FunctionForm
                        functionSignature={selectedFunction}
                        functionDetails={selectedFunctionDetails}
                        onSubmit={handleFunctionExecute}
                        isLoading={isExecuting}
                        walletRequired={true}
                        walletConnected={isConnected}
                        contractAddress={contractAddress}
                      />
                    )}
                  </div>
                )}

                {/* Connection Status */}
                {!isConnected && (
                  <div className="text-center p-4 border border-dashed border-cyber-accent-purple/30 rounded-lg">
                    <Key className="w-8 h-8 mx-auto mb-2 text-cyber-accent-purple" />
                    <p className="text-cyber-text-muted">Connect your wallet with private key to start interacting with contracts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-1">
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="text-cyber-accent-purple">Transaction History</CardTitle>
                <CardDescription className="text-cyber-text-muted">
                  Real-time status updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionHistory transactions={transactions} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyber-accent-purple/20 bg-cyber-dark/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-cyber-text-muted font-mono text-sm">
              © 2024 NITRO-NFT • Powered by Advanced Contract Interaction
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-cyber-secondary/50 text-cyber-secondary">
                v2.0.1
              </Badge>
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                Mainnet
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
