import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { connectWithPrivateKey } from '@/lib/web3Config';
import { ethers } from 'ethers';

interface PrivateKeyInputProps {
  onConnect: (address: string) => void;
}

const PrivateKeyInput: React.FC<PrivateKeyInputProps> = ({ onConnect }) => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectedAddress, setConnectedAddress] = useState<string>('');

  // Listen for private key connection events
  useEffect(() => {
    const handlePrivateKeyConnected = (event: CustomEvent) => {
      if (event.detail && event.detail.signer) {
        const signer = event.detail.signer as ethers.Signer;
        signer.getAddress().then(address => {
          setConnectedAddress(address);
          onConnect(address);
        });
      }
    };

    window.addEventListener('privateKeyConnected', handlePrivateKeyConnected as EventListener);
    
    return () => {
      window.removeEventListener('privateKeyConnected', handlePrivateKeyConnected as EventListener);
    };
  }, [onConnect]);

  const handleConnect = async () => {
    if (!privateKey || privateKey.trim() === '') {
      toast.error('Please enter a valid private key');
      return;
    }

    setIsConnecting(true);
    
    try {
      const keyToConnect = privateKey.trim();
      
      // Clear the input field for security
      setPrivateKey('');
      
      const signer = await connectWithPrivateKey(keyToConnect);
      
      if (signer) {
        const address = await signer.getAddress();
        console.log("Connected with private key, address:", address);
        
        toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        
        // The event listener will handle updating the UI
      } else {
        toast.error('Invalid private key');
      }
    } catch (error) {
      console.error('Error connecting with private key:', error);
      toast.error('Failed to connect with private key');
      setConnectedAddress('');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border border-amber-500/30 rounded-md bg-amber-950/20">
      <div className="text-amber-500 text-xs mb-2">
        Warning: Entering a private key is risky. Only use this in a trusted environment.
      </div>
      
      {connectedAddress && (
        <div className="p-2 bg-green-950/20 border border-green-500/30 rounded text-sm">
          <span className="text-green-500">Connected: </span>
          <span className="font-mono">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</span>
        </div>
      )}
      
      <Input
        type="password"
        placeholder="Enter private key (0x...)"
        value={privateKey}
        onChange={(e) => setPrivateKey(e.target.value)}
        className="font-mono bg-background/50"
      />
      <Button 
        onClick={handleConnect} 
        disabled={isConnecting || !!connectedAddress}
        className="w-full cyber-button-alt"
      >
        {isConnecting ? 'Connecting...' : connectedAddress ? 'Connected' : 'Connect with Private Key'}
      </Button>
      
      {connectedAddress && (
        <Button 
          onClick={() => {
            setConnectedAddress('');
            window.location.reload(); // Simple way to reset the app state
          }} 
          variant="outline"
          className="w-full mt-2"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
};

export default PrivateKeyInput;
