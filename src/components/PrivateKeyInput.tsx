
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { connectWithPrivateKey, chainOptions } from '@/lib/web3Config';
import { ethers } from 'ethers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PrivateKeyInputProps {
  onConnect: (address: string) => void;
}

const PrivateKeyInput: React.FC<PrivateKeyInputProps> = ({ onConnect }) => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [selectedChainId, setSelectedChainId] = useState<number>(1); // Default to Ethereum mainnet

  const handleConnect = async () => {
    if (!privateKey || privateKey.trim() === '') {
      toast.error('Please enter a valid private key');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Create a local copy of the private key to avoid state access during async operations
      const keyToConnect = privateKey.trim();
      
      // Clear the private key from state for security immediately
      setPrivateKey('');
      
      // Pass only the private key, the chainId will be handled in web3Config.ts
      const signer = await connectWithPrivateKey(keyToConnect);
      
      if (signer) {
        const address = await signer.getAddress();
        console.log("Connected with private key, address:", address);
        
        // Get chain name for the toast message
        const chainName = chainOptions.find(chain => chain.id === selectedChainId)?.name || 'Unknown Network';
        toast.success(`Connected to ${chainName}: ${address.slice(0, 6)}...${address.slice(-4)}`);
        
        // Call onConnect outside of state update to prevent freezing
        setTimeout(() => {
          onConnect(address);
        }, 0);
      } else {
        toast.error('Invalid private key');
      }
    } catch (error) {
      console.error('Error connecting with private key:', error);
      toast.error('Failed to connect with private key');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border border-amber-500/30 rounded-md bg-amber-950/20">
      <div className="text-amber-500 text-xs mb-2">
        Warning: Entering a private key is risky. Only use this in a trusted environment.
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="chain-select" className="text-xs text-muted-foreground">
          Select Network
        </Label>
        <Select 
          value={selectedChainId.toString()} 
          onValueChange={(value) => setSelectedChainId(parseInt(value))}
        >
          <SelectTrigger id="chain-select" className="bg-background/50">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {chainOptions.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
