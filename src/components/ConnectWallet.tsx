
import React from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/contractUtils';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';

const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isLoading: isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Find available connectors - prioritize MetaMask, then WalletConnect, then Coinbase
  const getAvailableConnectors = () => {
    // First check if any connector is ready (installed/available)
    const readyConnectors = connectors.filter(connector => connector.ready);
    
    if (readyConnectors.length > 0) {
      return readyConnectors;
    }
    
    // If no connectors are ready, return WalletConnect (which doesn't require installation)
    const walletConnectConnector = connectors.find(
      connector => connector.id === 'walletConnect'
    );
    
    if (walletConnectConnector) {
      return [walletConnectConnector];
    }
    
    // Fallback to all available connectors
    return connectors;
  };

  // Handle connect click - now showing a wallet selection UI if multiple options are available
  const handleConnect = async () => {
    const availableConnectors = getAvailableConnectors();
    
    if (availableConnectors.length === 0) {
      toast.error("No wallet connectors available");
      return;
    }
    
    if (availableConnectors.length === 1) {
      try {
        connect({ connector: availableConnectors[0] });
      } catch (err) {
        console.error("Connection error:", err);
        toast.error("Failed to connect wallet");
      }
      return;
    }
    
    // If multiple connectors are available, just use MetaMask by default
    // In a real app, you might want to show a modal here with options
    const metaMask = availableConnectors.find(c => c.id === 'metaMask');
    const walletConnect = availableConnectors.find(c => c.id === 'walletConnect');
    const connector = metaMask || walletConnect || availableConnectors[0];
    
    try {
      connect({ connector });
    } catch (err) {
      console.error("Connection error:", err);
      toast.error("Failed to connect wallet");
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded bg-cyber-dark border border-cyber-accent/30 text-sm font-mono">
          {ensName || shortenAddress(address as string)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="cyber-button-alt"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isPending}
      className="cyber-button"
    >
      {isPending ? 'Connecting...' : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
};

export default ConnectWallet;
