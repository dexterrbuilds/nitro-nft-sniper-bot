import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle } from "lucide-react";

interface FunctionSelectorProps {
  functions: { name: string; inputs: any[]; payable: boolean }[];
  onSelect: (functionName: string, functionDetails: any) => void; // Updated to pass details
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
      <div className="cyber-panel bg-cyber-dark/50 p-4 rounded-md border border-amber-500/30">
        <div className="flex items-center text-amber-400 mb-2">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <p className="font-medium">No Contract Functions Available</p>
        </div>
        <p className="text-muted-foreground text-sm">
          Could not detect any functions in this contract. This could be due to:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-5">
          <li>Invalid contract address</li>
          <li>Network connectivity issues</li>
          <li>Contract not verified on block explorer</li>
          <li>Contract using a non-standard ABI format</li>
        </ul>
      </div>
    );
  }

  // Filter functions based on search term
  const filteredFunctions = searchTerm
    ? functions.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : functions;

  // Generate unique function signatures to distinguish between overloaded functions
  const functionSignatures = filteredFunctions.map(func => {
    const paramTypes = func.inputs.map(input => input.type).join(',');
    const signature = `${func.name}(${paramTypes})`;
    return {
      ...func,
      signature,
      displayName: `${func.name}(${func.inputs.map(i => i.type).join(', ')})`
    };
  });

  // Group functions by category for easier selection
  const mintFunctions = functionSignatures.filter(f => 
    f.name.toLowerCase().includes('mint') || 
    f.name.toLowerCase() === 'buy' || 
    f.name.toLowerCase() === 'purchase'
  );
  
  const otherFunctions = functionSignatures.filter(f => 
    !mintFunctions.some(mf => mf.signature === f.signature)
  );

  const handleSelectFunction = (signature: string) => {
    // Find the full function details by signature
    const selectedFunc = functionSignatures.find(f => f.signature === signature);
    if (selectedFunc) {
      onSelect(selectedFunc.signature, selectedFunc);
    }
  };

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
          onValueChange={handleSelectFunction}
        >
          <SelectTrigger id="function-select" className="cyber-input">
            <SelectValue placeholder="Select function to call" />
          </SelectTrigger>
          <SelectContent>
            {mintFunctions.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs text-cyber-accent">Mint Functions</div>
                {mintFunctions.map((func) => (
                  <SelectItem key={func.signature} value={func.signature}>
                    {func.displayName}
                    {func.payable && ' (payable)'}
                  </SelectItem>
                ))}
              </>
            )}
            
            {otherFunctions.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs text-cyber-accent">Other Functions</div>
                {otherFunctions.map((func) => (
                  <SelectItem key={func.signature} value={func.signature}>
                    {func.displayName}
                    {func.payable && ' (payable)'}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        
        <div className="text-xs text-muted-foreground mt-1">
          {functionSignatures.length} functions available {searchTerm && `(filtered from ${functions.length})`}
        </div>
      </div>
    </div>
  );
};

export default FunctionSelector;
