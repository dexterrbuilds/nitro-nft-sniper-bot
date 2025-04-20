import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAccount, useBalance } from 'wagmi';
import { parseEth, formatEth } from '@/lib/contractUtils';
import { toast } from 'sonner';
import TimerScheduler from './TimerScheduler';
import { v4 as uuidv4 } from 'uuid';
import FunctionSelector from './FunctionSelector';

interface FunctionInput {
  name: string;
  type: string;
}

interface FunctionDetails {
  name: string;
  inputs: FunctionInput[];
  payable: boolean;
}

interface FunctionFormProps {
  functions: FunctionDetails[];
  onSubmit: (functionName: string, args: any[], value: string) => void;
  onSchedule?: (id: string, functionName: string, time: number, args: any[], value: string) => void;
  isLoading: boolean;
  walletRequired?: boolean;
  walletConnected?: boolean;
  contractAddress: string;
}

const FunctionForm: React.FC<FunctionFormProps> = ({
  functions,
  onSubmit,
  onSchedule,
  isLoading,
  walletRequired = false,
  walletConnected = false,
  contractAddress,
}) => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [currentFunctionDetails, setCurrentFunctionDetails] = useState<FunctionDetails | null>(null);
  const [args, setArgs] = useState<any[]>([]);
  const [ethValue, setEthValue] = useState<string>('0');
  const [gasPriority, setGasPriority] = useState<number>(50); // 50% as default
  
  // Handle function selection from the selector
  const handleFunctionSelect = (functionSignature: string) => {
    console.log("Function selected:", functionSignature);
    setSelectedFunction(functionSignature);
    
    // Find the function details based on the signature
    const match = functionSignature.match(/^([^(]+)\((.*)\)$/);
    if (match) {
      const [_, name, paramTypes] = match;
      const paramTypesArray = paramTypes ? paramTypes.split(',') : [];
      
      const foundFunction = functions.find(f => 
        f.name === name && 
        f.inputs.length === paramTypesArray.length &&
        f.inputs.every((input, i) => !paramTypesArray[i] || input.type === paramTypesArray[i])
      );
      
      if (foundFunction) {
        console.log("Found function details:", foundFunction);
        setCurrentFunctionDetails(foundFunction);
      } else {
        console.log("Could not find matching function details");
        setCurrentFunctionDetails(null);
      }
    }
  };
  
  // Reset form when function changes
  useEffect(() => {
    if (!currentFunctionDetails) {
      setArgs([]);
      setEthValue('0');
      return;
    }
    
    // Initialize args with default values based on input types
    const initialArgs = currentFunctionDetails.inputs.map((input) => {
      const type = input.type;
      // Default values based on common types
      if (type === 'address') return address || ethers.ZeroAddress;
      if (type === 'uint256' || type.startsWith('uint')) return '1'; // Default amount to 1
      if (type === 'bool') return false;
      if (type === 'string') return '';
      if (type.includes('[]')) return []; // Empty array for array types
      return '';
    });
    
    setArgs(initialArgs);
    setEthValue(currentFunctionDetails.payable ? '0.01' : '0'); // Set default ETH if payable
  }, [currentFunctionDetails, address]);

  const handleArgChange = (index: number, value: any) => {
    if (!currentFunctionDetails) return;
    
    const newArgs = [...args];
    
    // Handle type conversion for numeric inputs
    if (currentFunctionDetails.inputs[index].type.startsWith('uint') ||
        currentFunctionDetails.inputs[index].type.startsWith('int')) {
      // Allow empty string during typing
      if (value === '') {
        newArgs[index] = '';
      } else {
        try {
          // For regular numbers, just store the string value - we'll convert at submission
          newArgs[index] = value;
        } catch (e) {
          // If conversion fails, don't update
          return;
        }
      }
    } else if (currentFunctionDetails.inputs[index].type === 'bool') {
      newArgs[index] = value === 'true';
    } else {
      // For other types (address, string, etc.), just store the value
      newArgs[index] = value;
    }
    
    setArgs(newArgs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentFunctionDetails || !selectedFunction) {
      toast.error('Please select a function first');
      return;
    }
    
    // Validate inputs
    for (let i = 0; i < currentFunctionDetails.inputs.length; i++) {
      const input = currentFunctionDetails.inputs[i];
      const arg = args[i];
      
      // Check required fields
      if (arg === '' || arg === undefined) {
        toast.error(`${input.name || `Parameter #${i+1}`} is required`);
        return;
      }
      
      // Validate addresses
      if (input.type === 'address') {
        if (!ethers.isAddress(arg)) {
          toast.error(`${input.name || `Parameter #${i+1}`} is not a valid address`);
          return;
        }
      }
      
      // Validate numbers
      if (input.type.startsWith('uint') || input.type.startsWith('int')) {
        try {
          // Ensure it's a valid number
          if (isNaN(Number(arg))) throw new Error('Not a number');
        } catch (e) {
          toast.error(`${input.name || `Parameter #${i+1}`} is not a valid number`);
          return;
        }
      }
    }
    
    // Validate ETH value if payable
    if (currentFunctionDetails.payable) {
      try {
        const value = parseEth(ethValue);
        if (value < 0) throw new Error('Negative value');
        if (balance && value > balance.value) {
          toast.error('Insufficient funds for this transaction');
          return;
        }
      } catch (e) {
        toast.error('Invalid ETH amount');
        return;
      }
    }
    
    // Validate wallet connection if required
    if (walletRequired && !walletConnected) {
      toast.error('Please connect your wallet to execute this function');
      return;
    }
    
    onSubmit(currentFunctionDetails.name, args, ethValue);
  };
  
  const handleScheduleTransaction = (scheduledTime: number, callback: () => Promise<void>) => {
    if (!currentFunctionDetails || !selectedFunction) {
      toast.error('Please select a function first');
      return;
    }
    
    // Validate inputs before scheduling
    for (let i = 0; i < currentFunctionDetails.inputs.length; i++) {
      const input = currentFunctionDetails.inputs[i];
      const arg = args[i];
      
      if (arg === '' || arg === undefined) {
        toast.error(`${input.name || `Parameter #${i+1}`} is required for scheduling`);
        return;
      }
      
      if (input.type === 'address') {
        if (!ethers.isAddress(arg)) {
          toast.error(`${input.name || `Parameter #${i+1}`} is not a valid address`);
          return;
        }
      }
    }
    
    // Validate wallet connection
    if (walletRequired && !walletConnected) {
      toast.error('Please connect your wallet to schedule this transaction');
      return;
    }
    
    const transactionId = uuidv4();
    
    if (onSchedule) {
      onSchedule(transactionId, currentFunctionDetails.name, scheduledTime, [...args], ethValue);
    }
  };

  return (
    <div className="space-y-6">
      {/* Function Selector */}
      <FunctionSelector 
        functions={functions}
        onSelect={handleFunctionSelect}
        selectedFunction={selectedFunction}
      />
      
      {/* Form section */}
      <div className="space-y-4 pt-2">
        {currentFunctionDetails ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Function parameters */}
            {currentFunctionDetails.inputs.length > 0 ? (
              currentFunctionDetails.inputs.map((input, index) => (
                <div key={index} className="grid gap-2">
                  <Label htmlFor={`input-${index}`} className="text-sm font-mono">
                    {input.name || `Parameter #${index+1}`}{' '}
                    <span className="text-cyber-accent text-xs">{input.type}</span>
                  </Label>
                  <Input
                    id={`input-${index}`}
                    value={args[index]?.toString() || ''}
                    onChange={(e) => handleArgChange(index, e.target.value)}
                    placeholder={`Enter ${input.type}`}
                    className="cyber-input font-mono"
                    disabled={isLoading}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground">
                This function has no parameters
              </div>
            )}
            
            {/* ETH value input for payable functions */}
            {currentFunctionDetails.payable && (
              <div className="grid gap-2">
                <Label htmlFor="eth-value" className="text-sm font-mono">
                  ETH Value <span className="text-muted-foreground text-xs">(payable)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="eth-value"
                    type="number"
                    step="0.00001"
                    min="0"
                    value={ethValue}
                    onChange={(e) => setEthValue(e.target.value)}
                    placeholder="ETH Amount"
                    className="cyber-input font-mono"
                    disabled={isLoading}
                  />
                  <div className="w-24 p-2 border border-cyber-accent/30 rounded text-right text-sm font-mono bg-cyber-dark/50">
                    {balance ? formatEth(balance.value) : '0'} ETH
                  </div>
                </div>
              </div>
            )}

            {/* Gas priority slider */}
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="gas-priority" className="text-sm font-mono">
                  Gas Priority
                </Label>
                <span className="text-xs font-mono">{gasPriority}%</span>
              </div>
              <Slider
                id="gas-priority"
                min={1}
                max={200}
                step={1}
                value={[gasPriority]}
                onValueChange={(value) => setGasPriority(value[0])}
                disabled={isLoading}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>Slow</span>
                <span>Average</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Execute button */}
            <Button 
              type="submit" 
              className="w-full cyber-button font-mono mt-6"
              disabled={isLoading || (walletRequired && !walletConnected)} 
            >
              {isLoading ? 'Processing...' : `Execute ${currentFunctionDetails.name}`}
              {walletRequired && !walletConnected && ' (Connect Wallet)'}
            </Button>
            
            {/* Timer scheduler */}
            {onSchedule && (
              <TimerScheduler
                onSchedule={handleScheduleTransaction}
                functionName={currentFunctionDetails.name}
                contractAddress={contractAddress}
                isActive={walletConnected && !isLoading}
              />
            )}
          </form>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-cyber-accent/20 rounded-md">
            Select a function above to continue
          </div>
        )}
      </div>
    </div>
  );
};

export default FunctionForm;
