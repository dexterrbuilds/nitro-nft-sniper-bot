
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Shield, TrendingUp } from 'lucide-react';
import TransactionHistory, { Transaction } from '@/components/TransactionHistory';

const Index = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Mock real-time transaction updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random transaction status updates
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

  const handleConnectWallet = () => {
    // Mock wallet connection
    setIsConnected(true);
    setWalletAddress('0x742d35Cc6634C0532925a3b8D4C7');
    toast.success('Wallet connected successfully!');
  };

  const handleDisconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    toast.info('Wallet disconnected');
  };

  const addMockTransaction = () => {
    const mockTx: Transaction = {
      id: `tx-${Date.now()}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      functionName: 'mint',
      contractAddress: '0x742d35Cc6634C0532925a3b8D4C7',
      value: '0.1',
      status: 'pending',
      timestamp: Date.now(),
    };
    
    setTransactions(prev => [mockTx, ...prev]);
    toast.info('Transaction submitted');
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
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    Connected
                  </Badge>
                  <Button 
                    onClick={handleDisconnectWallet}
                    variant="outline"
                    size="sm"
                    className="cyber-button-alt"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleConnectWallet}
                  className="cyber-button"
                >
                  Connect Wallet
                </Button>
              )}
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

          {/* Contract Interaction Panel */}
          <div className="lg:col-span-2">
            <Card className="cyber-panel cyber-border-animated h-fit">
              <CardHeader>
                <CardTitle className="cyber-glow-text">Contract Interaction</CardTitle>
                <CardDescription className="text-cyber-text-muted">
                  Execute smart contract functions with optimized gas usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-cyber-text">Contract Address</Label>
                    <Input 
                      placeholder="0x..." 
                      className="cyber-input"
                      disabled={!isConnected}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyber-text">Function</Label>
                    <Input 
                      placeholder="mint, transfer, etc." 
                      className="cyber-input"
                      disabled={!isConnected}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-cyber-text">Parameters (JSON)</Label>
                  <Input 
                    placeholder='{"to": "0x...", "amount": "1"}' 
                    className="cyber-input"
                    disabled={!isConnected}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-cyber-text">Gas Limit</Label>
                    <Input 
                      placeholder="Auto" 
                      className="cyber-input"
                      disabled={!isConnected}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyber-text">Value (ETH)</Label>
                    <Input 
                      placeholder="0.0" 
                      className="cyber-input"
                      disabled={!isConnected}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={addMockTransaction}
                    disabled={!isConnected}
                    className="cyber-button flex-1"
                  >
                    Execute Transaction
                  </Button>
                  <Button 
                    variant="outline" 
                    disabled={!isConnected}
                    className="cyber-button-alt flex-1"
                  >
                    Simulate
                  </Button>
                </div>
                
                {!isConnected && (
                  <div className="text-center p-4 border border-dashed border-cyber-accent-purple/30 rounded-lg">
                    <p className="text-cyber-text-muted">Connect your wallet to start interacting with contracts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-1">
            <Card className="cyber-panel h-fit">
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
