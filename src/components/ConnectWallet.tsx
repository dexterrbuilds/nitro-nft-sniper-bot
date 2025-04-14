
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/contractUtils';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { connectWithEthers, connectWithMetaMask, connectWithWalletConnect } from '@/lib/web3Config';
import { ethers } from 'ethers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isLoading: isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle MetaMask connection
  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    
    try {
      const signer = await connectWithMetaMask();
      
      if (signer) {
        const address = await signer.getAddress();
        console.log("Connected with MetaMask:", address);
        toast.success("Wallet connected successfully");
      } else {
        toast.error("MetaMask not detected. Please install MetaMask.");
      }
    } catch (err) {
      console.error("MetaMask connection error:", err);
      toast.error("Failed to connect MetaMask");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle WalletConnect connection
  const handleConnectWalletConnect = async () => {
    setIsConnecting(true);
    
    try {
      const signer = await connectWithWalletConnect();
      
      if (signer) {
        const address = await signer.getAddress();
        console.log("Connected with WalletConnect:", address);
        toast.success("WalletConnect connected successfully");
      } else {
        toast.error("Failed to connect with WalletConnect");
      }
    } catch (err) {
      console.error("WalletConnect error:", err);
      toast.error("Failed to connect with WalletConnect");
    } finally {
      setIsConnecting(false);
    }
  };

  // General connect method that tries all options
  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Try to connect using ethers (tries MetaMask first, then WalletConnect)
      const signer = await connectWithEthers();
      
      if (signer) {
        const address = await signer.getAddress();
        console.log("Connected wallet address:", address);
        toast.success("Wallet connected successfully");
        return;
      }
      
      // If all direct methods failed, show error
      toast.error("No wallet detected. Please use the dropdown to select a wallet.");
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="cyber-button"
          disabled={isConnecting || isPending}
        >
          {isConnecting || isPending ? 'Connecting...' : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem onClick={handleConnectMetaMask}>
          MetaMask
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleConnectWalletConnect}>
          WalletConnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ConnectWallet;
