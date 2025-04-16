
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from '@/components/ui/button';

interface FunctionSelectorProps {
  functions: { name: string; inputs: any[]; payable: boolean }[];
  onSelect: (functionName: string) => void;
  selectedFunction: string | null;
}

const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  functions,
  onSelect,
  selectedFunction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!functions || functions.length === 0) {
    return (
      <div className="cyber-panel bg-cyber-dark/50 p-3 text-sm">
        <p className="text-muted-foreground italic">No functions detected in this contract.</p>
      </div>
    );
  }

  // Filter functions based on search term
  const filteredFunctions = searchTerm
    ? functions.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : functions;

  // Group functions by category for easier selection
  const mintFunctions = filteredFunctions.filter(f => 
    f.name.toLowerCase().includes('mint') || 
    f.name.toLowerCase() === 'buy' || 
    f.name.toLowerCase() === 'purchase'
  );
  
  const otherFunctions = filteredFunctions.filter(f => 
    !mintFunctions.some(mf => mf.name === f.name)
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search functions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 cyber-input text-sm"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="function-select" className="text-sm font-mono">
          Contract Function
        </Label>
        <Select 
          value={selectedFunction || ''} 
          onValueChange={onSelect}
        >
          <SelectTrigger id="function-select" className="cyber-input">
            <SelectValue placeholder="Select function to call" />
          </SelectTrigger>
          <SelectContent>
            {mintFunctions.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs text-cyber-accent">Mint Functions</div>
                {mintFunctions.map((func) => (
                  <SelectItem key={func.name} value={func.name}>
                    {func.name}
                    {func.payable && ' (payable)'}
                  </SelectItem>
                ))}
              </>
            )}
            
            {otherFunctions.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs text-cyber-accent">Other Functions</div>
                {otherFunctions.map((func) => (
                  <SelectItem key={func.name} value={func.name}>
                    {func.name}
                    {func.payable && ' (payable)'}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        
        <div className="text-xs text-muted-foreground mt-1">
          {filteredFunctions.length} functions available {searchTerm && `(filtered from ${functions.length})`}
        </div>
      </div>
    </div>
  );
};

export default FunctionSelector;
