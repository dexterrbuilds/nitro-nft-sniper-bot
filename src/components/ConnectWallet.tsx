
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/contractUtils';
import { Wallet, Key, X } from 'lucide-react';
import { toast } from 'sonner';
import { connectWithPrivateKey } from '@/lib/web3Config';
import { ethers } from 'ethers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import PrivateKeyInput from './PrivateKeyInput';

const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { disconnect } = useDisconnect();
  const [privateKeyDialogOpen, setPrivateKeyDialogOpen] = useState(false);

  // Handle private key connection
  const handlePrivateKeyConnect = (address: string) => {
    console.log("Connected with private key, address:", address);
    setPrivateKeyDialogOpen(false);
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
      <Button
        className="cyber-button"
        onClick={() => setPrivateKeyDialogOpen(true)}
      >
        <Key className="w-4 h-4 mr-2" />
        Connect with Private Key
      </Button>

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
