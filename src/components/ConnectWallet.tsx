
import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/contractUtils';
import { Key, X, Shield } from 'lucide-react';
import { toast } from 'sonner';
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
  const [privateKeyAddress, setPrivateKeyAddress] = useState<string | null>(null);

  // Listen for private key connection events
  useEffect(() => {
    const handlePrivateKeyConnected = (event: CustomEvent) => {
      if (event.detail && event.detail.signer) {
        const signer = event.detail.signer as any;
        signer.getAddress().then((address: string) => {
          setPrivateKeyAddress(address);
          setPrivateKeyDialogOpen(false);
        });
      }
    };

    window.addEventListener('privateKeyConnected', handlePrivateKeyConnected as EventListener);
    
    return () => {
      window.removeEventListener('privateKeyConnected', handlePrivateKeyConnected as EventListener);
    };
  }, []);

  // Handle private key connection
  const handlePrivateKeyConnect = (address: string) => {
    setPrivateKeyAddress(address);
    setPrivateKeyDialogOpen(false);
  };

  const handleDisconnect = () => {
    if (isConnected) {
      disconnect();
    }
    setPrivateKeyAddress(null);
    window.location.reload(); // Simple way to reset the app state
  };

  // Show connected state for either wallet or private key
  if (isConnected || privateKeyAddress) {
    const displayAddress = privateKeyAddress || address;
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded bg-cyber-dark border border-cyber-accent/30 text-sm font-mono flex items-center">
          {privateKeyAddress && (
            <Shield className="w-3 h-3 mr-1.5 text-cyber-accent" />
          )}
          <span className="text-cyber-text">{ensName || shortenAddress(displayAddress as string)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
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
        <DialogContent className="sm:max-w-md cyber-panel">
          <DialogHeader>
            <DialogTitle className="flex items-center text-cyber-text">
              <Key className="w-4 h-4 mr-2" />
              Connect with Private Key
            </DialogTitle>
            <DialogDescription className="text-cyber-text-muted">
              Enter your private key to connect directly. Use this only in a secure environment.
            </DialogDescription>
          </DialogHeader>
          
          <PrivateKeyInput onConnect={handlePrivateKeyConnect} />
          
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="secondary" 
              className="absolute top-2 right-2 h-8 w-8 p-0 cyber-button-alt"
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
