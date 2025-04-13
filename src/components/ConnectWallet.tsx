
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

  // Find available connectors
  const availableConnector = connectors.find(connector => connector.ready);

  // Handle connect click
  const handleConnect = async () => {
    if (!availableConnector) {
      toast.error("No wallet connectors available. Please install MetaMask or another wallet");
      return;
    }
    
    try {
      connect({ connector: availableConnector });
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
