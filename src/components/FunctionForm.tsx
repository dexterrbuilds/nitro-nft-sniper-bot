import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccount, useBalance } from 'wagmi';
import { parseEth, formatEth } from '@/lib/contractUtils';
import { toast } from 'sonner';
import TimerScheduler from './TimerScheduler';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle } from 'lucide-react';

interface FunctionFormProps {
  functionSignature: string; // Now using full signature instead of just name
  functionDetails: { name: string; inputs: any[]; payable: boolean; signature?: string };
  onSubmit: (signature: string, args: any[], value: string) => void;
  onSchedule?: (id: string, time: number, signature: string, args: any[], value: string) => void;
  isLoading: boolean;
  walletRequired?: boolean;
  walletConnected?: boolean;
  contractAddress: string;
}

const FunctionForm: React.FC<FunctionFormProps> = ({
  functionSignature,
  functionDetails,
  onSubmit,
  onSchedule,
  isLoading,
  walletRequired = false,
  walletConnected = false,
  contractAddress,
}) => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const [args, setArgs] = useState<any[]>([]);
  const [ethValue, setEthValue] = useState<string>('0'); // Start with 0 ETH by default
  const [gasPriority, setGasPriority] = useState<number>(50); // 50% as default
  const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);
  
  // Reset form when function changes
  useEffect(() => {
    console.log("Function details updating:", functionDetails);
    if (!functionDetails || !functionDetails.inputs) {
      console.error("Missing function details or inputs");
      return;
    }
    
    // Initialize args with default values based on input types
    const initialArgs = functionDetails.inputs.map((input) => {
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
    // Set default ETH to 0 for payable functions
    setEthValue(functionDetails.payable ? '0' : '0'); 
  }, [functionSignature, functionDetails, address]);

  // Check for balance when ethValue changes
  useEffect(() => {
    if (balance && functionDetails?.payable) {
      try {
        const value = parseEth(ethValue || '0');
        setInsufficientFunds(value > balance.value);
      } catch (e) {
        // Invalid ETH value, not setting insufficient funds yet
        setInsufficientFunds(false);
      }
    }
  }, [ethValue, balance, functionDetails]);

  const handleArgChange = (index: number, value: any) => {
    if (!functionDetails || !functionDetails.inputs) return;
    
    const newArgs = [...args];
    
    // Handle type conversion for numeric inputs
    if (functionDetails.inputs[index].type.startsWith('uint') ||
        functionDetails.inputs[index].type.startsWith('int')) {
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
    } else if (functionDetails.inputs[index].type === 'bool') {
      newArgs[index] = value === 'true';
    } else {
      // For other types (address, string, etc.), just store the value
      newArgs[index] = value;
    }
    
    setArgs(newArgs);
  };

  const handleEthValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEthValue(newValue);
    
    // Check if we have sufficient funds
    if (balance) {
      try {
        const value = parseEth(newValue || '0');
        setInsufficientFunds(value > balance.value);
      } catch (e) {
        // Invalid ETH value
        setInsufficientFunds(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!functionDetails || !functionDetails.inputs) {
      toast.error("Function details not loaded properly");
      return;
    }
    
    // Validate inputs
    for (let i = 0; i < functionDetails.inputs.length; i++) {
      const input = functionDetails.inputs[i];
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
    if (functionDetails.payable) {
      try {
        const value = parseEth(ethValue || '0');
        if (value < 0n) {
          toast.error('ETH value cannot be negative');
          return;
        }
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
    
    // Pass the full function signature to onSubmit
    onSubmit(functionSignature, args, ethValue || '0');
  };
  
  const handleScheduleTransaction = (scheduledTime: number, callback: () => Promise<void>) => {
    if (!functionDetails || !functionDetails.inputs) return;
    
    // Validate inputs before scheduling
    for (let i = 0; i < functionDetails.inputs.length; i++) {
      const input = functionDetails.inputs[i];
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
    
    // Validate ETH value if payable
    if (functionDetails.payable) {
      try {
        const value = parseEth(ethValue || '0');
        if (value < 0n) {
          toast.error('ETH value cannot be negative');
          return;
        }
        if (balance && value > balance.value) {
          toast.error('Insufficient funds for this transaction');
          return;
        }
      } catch (e) {
        toast.error('Invalid ETH amount');
        return;
      }
    }
    
    const transactionId = uuidv4();
    
    if (onSchedule) {
      onSchedule(transactionId, scheduledTime, functionSignature, [...args], ethValue || '0');
    }
  };

  // Guard against missing function details
  if (!functionDetails || !functionDetails.inputs) {
    return (
      <div className="p-4 border border-red-500 rounded-md bg-red-500/10">
        <p className="text-red-400 font-medium">Error loading function form</p>
        <p className="text-sm text-muted-foreground mt-1">Unable to load function details. Please try selecting the function again.</p>
      </div>
    );
  }

  // Extract function name from the signature for display purposes
  const displayName = functionDetails.name;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {functionDetails.inputs.map((input, index) => (
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
      ))}

      {functionDetails.payable && (
        <div className="grid gap-2">
          <Label htmlFor="eth-value" className="text-sm font-mono flex items-center">
            ETH Value <span className="text-muted-foreground text-xs ml-2">(payable)</span>
            {balance && (
              <span className="ml-auto text-xs text-muted-foreground">
                Balance: {formatEth(balance.value)} ETH
              </span>
            )}
          </Label>
          <div className="flex gap-2">
            <Input
              id="eth-value"
              type="number"
              step="0.0001"
              min="0"
              value={ethValue}
              onChange={handleEthValueChange}
              placeholder="ETH Amount"
              className={`cyber-input font-mono ${insufficientFunds ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          
          {insufficientFunds && (
            <Alert variant="destructive" className="py-2 mt-1">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription className="text-xs">
                Insufficient funds. Available: {formatEth(balance?.value || 0n)} ETH
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

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

      <Button 
        type="submit" 
        className="w-full cyber-button font-mono mt-6"
        disabled={isLoading || (walletRequired && !walletConnected) || insufficientFunds} 
      >
        {isLoading ? 'Processing...' : `Execute ${displayName}`}
        {walletRequired && !walletConnected && ' (Connect Wallet)'}
      </Button>
      
      {/* Add transaction scheduling */}
      {onSchedule && (
        <TimerScheduler
          onSchedule={handleScheduleTransaction}
          functionName={displayName}
          contractAddress={contractAddress}
          isActive={walletConnected && !isLoading && !insufficientFunds}
        />
      )}
    </form>
  );
};

export default FunctionForm;
