
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { isValidAddress } from '@/lib/contractUtils';
import { chainOptions } from '@/lib/web3Config';

interface ContractInputFormProps {
  onSubmit: (contractAddress: string, chainId: number) => void;
  isLoading: boolean;
}

const ContractInputForm: React.FC<ContractInputFormProps> = ({ onSubmit, isLoading }) => {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedChainId, setSelectedChainId] = useState<number>(5); // Default to Goerli testnet

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractAddress) {
      toast.error('Please enter a contract address');
      return;
    }

    if (!isValidAddress(contractAddress)) {
      toast.error('Please enter a valid contract address');
      return;
    }
    
    onSubmit(contractAddress, selectedChainId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 cyber-panel">
      <div className="grid gap-2">
        <Label htmlFor="contractAddress" className="text-sm font-mono">
          NFT Contract Address
        </Label>
        <Input
          id="contractAddress"
          placeholder="0x..."
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          className="cyber-input font-mono"
          disabled={isLoading}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="chain" className="text-sm font-mono">
          Network
        </Label>
        <Select 
          value={selectedChainId.toString()} 
          onValueChange={(value) => setSelectedChainId(parseInt(value))}
          disabled={isLoading}
        >
          <SelectTrigger id="chain" className="cyber-input">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent className="bg-cyber-dark border-cyber-accent-purple/30 z-50">
            {chainOptions.map((chain) => (
              <SelectItem 
                key={chain.id} 
                value={chain.id.toString()}
                className="text-cyber-text hover:bg-cyber-accent-purple/20 focus:bg-cyber-accent-purple/20"
              >
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        type="submit" 
        className="w-full cyber-button"
        disabled={isLoading || !contractAddress} 
      >
        {isLoading ? 'Loading...' : 'Analyze Contract'}
      </Button>
    </form>
  );
};

export default ContractInputForm;
