
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { connectWithPrivateKey } from '@/lib/web3Config';

interface PrivateKeyInputProps {
  onConnect: (address: string) => void;
}

const PrivateKeyInput: React.FC<PrivateKeyInputProps> = ({ onConnect }) => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleConnect = async () => {
    if (!privateKey || privateKey.trim() === '') {
      toast.error('Please enter a valid private key');
      return;
    }

    setIsConnecting(true);
    try {
      const signer = await connectWithPrivateKey(privateKey.trim());
      if (signer) {
        const address = await signer.getAddress();
        toast.success(`Connected with private key: ${address.slice(0, 6)}...${address.slice(-4)}`);
        onConnect(address);
      } else {
        toast.error('Invalid private key');
      }
    } catch (error) {
      console.error('Error connecting with private key:', error);
      toast.error('Failed to connect with private key');
    } finally {
      setIsConnecting(false);
      // Clear the private key from state for security
      setPrivateKey('');
    }
  };

  return (
    <div className="space-y-3 p-4 border border-amber-500/30 rounded-md bg-amber-950/20">
      <div className="text-amber-500 text-xs mb-2">
        Warning: Entering a private key is risky. Only use this in a trusted environment.
      </div>
      <Input
        type="password"
        placeholder="Enter private key (0x...)"
        value={privateKey}
        onChange={(e) => setPrivateKey(e.target.value)}
        className="font-mono bg-background/50"
      />
      <Button 
        onClick={handleConnect} 
        disabled={isConnecting}
        className="w-full cyber-button-alt"
      >
        {isConnecting ? 'Connecting...' : 'Connect with Private Key'}
      </Button>
    </div>
  );
};

export default PrivateKeyInput;
