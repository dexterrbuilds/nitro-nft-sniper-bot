
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/contractUtils';
import { Wallet, Key, X } from 'lucide-react';
import { toast } from 'sonner';
import { connectWithEthers, connectWithMetaMask, connectWithWalletConnect, connectWithPrivateKey } from '@/lib/web3Config';
import { ethers } from 'ethers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import PrivateKeyInput from './PrivateKeyInput';

const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isLoading: isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [privateKeyDialogOpen, setPrivateKeyDialogOpen] = useState(false);

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

  // Handle private key connection
  const handlePrivateKeyConnect = (address: string) => {
    console.log("Connected with private key, address:", address);
    setPrivateKeyDialogOpen(false);
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
    <>
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPrivateKeyDialogOpen(true)}>
            <Key className="w-3.5 h-3.5 mr-2" />
            Use Private Key
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={privateKeyDialogOpen} onOpenChange={setPrivateKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Key className="w-4 h-4 mr-2" />
              Connect with Private Key
            </DialogTitle>
            <DialogDescription>
              Enter your private key to connect directly. Use this only in a secure environment.
            </DialogDescription>
          </DialogHeader>
          <PrivateKeyInput onConnect={handlePrivateKeyConnect} />
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="secondary" 
              className="absolute top-2 right-2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConnectWallet;
