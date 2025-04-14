
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/contractUtils';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { connectWithEthers } from '@/lib/web3Config';
import { ethers } from 'ethers';

const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isLoading: isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle connect click with ethers.js as primary and wagmi as fallback
  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // First try connecting with ethers.js directly
      const signer = await connectWithEthers();
      
      if (signer) {
        // Successfully connected with ethers
        const address = await signer.getAddress();
        console.log("Connected with ethers.js:", address);
        
        // Note: The UI will update through wagmi's autoConnect
        toast.success("Wallet connected successfully");
        setIsConnecting(false);
        return;
      }
      
      // If ethers direct connection failed, try wagmi MetaMask connector
      const metaMask = connectors.find(c => c.id === 'metaMask');
      
      if (metaMask && metaMask.ready) {
        connect({ connector: metaMask });
      } else {
        toast.error("No wallet detected. Please install MetaMask or another Ethereum wallet");
      }
    } catch (err) {
      console.error("Connection error:", err);
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
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
      disabled={isConnecting || isPending}
      className="cyber-button"
    >
      {isConnecting || isPending ? 'Connecting...' : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
};

export default ConnectWallet;
