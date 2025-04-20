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

interface FunctionFormProps {
  functionName: string;
  functionDetails: { name: string; inputs: any[]; payable: boolean };
  onSubmit: (args: any[], value: string, gasPriority: number) => void;
  onSchedule?: (id: string, time: number, args: any[], value: string, gasPriority: number) => void;
  isLoading: boolean;
  walletRequired?: boolean;
  walletConnected?: boolean;
  contractAddress: string;
}

const FunctionForm: React.FC<FunctionFormProps> = ({
  functionName,
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
  const [ethValue, setEthValue] = useState<string>('0');
  const [gasPriority, setGasPriority] = useState<number>(50);

  // Add debugging to trace props received
  useEffect(() => {
    console.log("FunctionForm render:", { 
      functionName, 
      inputs: functionDetails?.inputs,
      payable: functionDetails?.payable,
      walletConnected
    });
  }, [functionName, functionDetails, walletConnected]);

  useEffect(() => {
    // Only initialize if functionDetails is properly defined
    if (functionDetails && functionDetails.inputs) {
      const initialArgs = functionDetails.inputs.map((input) => {
        if (input.type === 'address') return address || ethers.ZeroAddress;
        if (input.type === 'uint256' || input.type.startsWith('uint')) return '1';
        if (input.type === 'bool') return false;
        if (input.type === 'string') return '';
        if (input.type.includes('[]')) return [];
        return '';
      });

      setArgs(initialArgs);
      setEthValue(functionDetails.payable ? '0.01' : '0');
    }
  }, [functionName, functionDetails, address]);

  // Handle case where functionDetails is undefined or incomplete
  if (!functionDetails || !functionDetails.inputs) {
    return <div className="p-4 text-center text-yellow-500 font-mono">Please select a valid function</div>;
  }

  const handleArgChange = (index: number, value: any) => {
    const newArgs = [...args];

    if (functionDetails.inputs[index].type.startsWith('uint') || functionDetails.inputs[index].type.startsWith('int')) {
      newArgs[index] = value;
    } else if (functionDetails.inputs[index].type === 'bool') {
      newArgs[index] = value === 'true';
    } else {
      newArgs[index] = value;
    }

    setArgs(newArgs);
  };

  const validateInputs = (): boolean => {
    for (let i = 0; i < functionDetails.inputs.length; i++) {
      const input = functionDetails.inputs[i];
      const arg = args[i];

      if (arg === '' || arg === undefined) {
        toast.error(`${input.name || `Parameter #${i + 1}`} is required`);
        return false;
      }

      if (input.type === 'address' && !ethers.isAddress(arg)) {
        toast.error(`${input.name || `Parameter #${i + 1}`} is not a valid address`);
        return false;
      }

      if ((input.type.startsWith('uint') || input.type.startsWith('int')) && isNaN(Number(arg))) {
        toast.error(`${input.name || `Parameter #${i + 1}`} is not a valid number`);
        return false;
      }
    }

    if (functionDetails.payable) {
      try {
        const value = parseEth(ethValue);
        if (value < 0) throw new Error('Negative value');
        if (balance && value > balance.value) {
          toast.error('Insufficient funds');
          return false;
        }
      } catch {
        toast.error('Invalid ETH value');
        return false;
      }
    }

    if (walletRequired && !walletConnected) {
      toast.error('Please connect your wallet');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    onSubmit(args, ethValue, gasPriority);
  };

  const handleScheduleTransaction = (scheduledTime: number, callback: () => Promise<void>) => {
    if (!validateInputs()) return;

    const transactionId = uuidv4();
    if (onSchedule) {
      onSchedule(transactionId, scheduledTime, [...args], ethValue, gasPriority);
      toast.success(`Scheduled ✅ ID: ${transactionId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {functionDetails.inputs.map((input, index) => (
        <div key={index} className="grid gap-2">
          <Label htmlFor={`input-${index}`} className="text-sm font-mono">
            {input.name || `Parameter #${index + 1}`}{' '}
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
        disabled={isLoading || (walletRequired && !walletConnected)}
      >
        {isLoading ? 'Processing...' : `Execute ${functionName}`}
      </Button>

      {onSchedule && (
        <TimerScheduler
          onSchedule={handleScheduleTransaction}
          functionName={functionName}
          contractAddress={contractAddress}
          isActive={walletConnected && !isLoading}
        />
      )}
    </form>
  );
};

export default FunctionForm;
