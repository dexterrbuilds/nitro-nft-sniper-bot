
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Timer, Clock, Calendar, Zap } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { scheduleTransaction, ScheduledTransaction } from '@/lib/timerUtils';

interface TimerSchedulerProps {
  onScheduleTransaction?: (transaction: ScheduledTransaction) => void;
  contractAddress: string;
  functionSignature: string;
  functionDetails: any;
  parameters: any[];
  ethValue: string;
}

const TimerScheduler: React.FC<TimerSchedulerProps> = ({
  onScheduleTransaction,
  contractAddress,
  functionSignature,
  functionDetails,
  parameters,
  ethValue
}) => {
  const [schedulingMode, setSchedulingMode] = useState<'immediate' | 'delay' | 'specific'>('immediate');
  const [delayMinutes, setDelayMinutes] = useState<number>(1);
  const [specificDateTime, setSpecificDateTime] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  // Set default specific time to 1 hour from now
  useEffect(() => {
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    setSpecificDateTime(oneHourFromNow.toISOString().slice(0, 16));
  }, []);

  const getExecutionTime = (): number => {
    const now = Date.now();
    
    switch (schedulingMode) {
      case 'immediate':
        return now + 1000; // Execute in 1 second
      case 'delay':
        return now + (delayMinutes * 60 * 1000);
      case 'specific':
        return new Date(specificDateTime).getTime();
      default:
        return now;
    }
  };

  const handleScheduleTransaction = async () => {
    if (!contractAddress || !functionSignature) {
      toast.error('Contract address and function required');
      return;
    }

    const executionTime = getExecutionTime();
    
    if (executionTime <= Date.now()) {
      toast.error('Execution time must be in the future');
      return;
    }

    setIsScheduling(true);

    try {
      const scheduledTransaction = scheduleTransaction({
        contractAddress,
        functionSignature,
        functionDetails,
        parameters,
        ethValue,
        scheduledTime: executionTime
      });

      if (onScheduleTransaction) {
        onScheduleTransaction(scheduledTransaction);
      }

      toast.success(`Transaction scheduled for ${new Date(executionTime).toLocaleString()}`);
      
      // Reset form
      setSchedulingMode('immediate');
      setDelayMinutes(1);
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
      setSpecificDateTime(oneHourFromNow.toISOString().slice(0, 16));
      
    } catch (error) {
      console.error('Error scheduling transaction:', error);
      toast.error('Failed to schedule transaction');
    } finally {
      setIsScheduling(false);
    }
  };

  const formatExecutionTime = (): string => {
    const executionTime = getExecutionTime();
    const timeUntil = Math.max(0, executionTime - Date.now());
    
    if (timeUntil < 60000) { // Less than 1 minute
      return `in ${Math.ceil(timeUntil / 1000)} seconds`;
    } else if (timeUntil < 3600000) { // Less than 1 hour
      return `in ${Math.ceil(timeUntil / 60000)} minutes`;
    } else {
      return `at ${new Date(executionTime).toLocaleTimeString()}`;
    }
  };

  return (
    <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-cyber-accent" />
            <CardTitle className="text-sm">Schedule Transaction</CardTitle>
          </div>
          <Badge variant="cyber">
            Timer
          </Badge>
        </div>
        <CardDescription>
          Execute the transaction at a specific time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-mono">Execution Timing</Label>
          <Select value={schedulingMode} onValueChange={(value: any) => setSchedulingMode(value)}>
            <SelectTrigger className="cyber-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Execute Immediately
                </div>
              </SelectItem>
              <SelectItem value="delay">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Delay by Minutes
                </div>
              </SelectItem>
              <SelectItem value="specific">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Specific Date & Time
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {schedulingMode === 'delay' && (
          <div className="space-y-2">
            <Label htmlFor="delay" className="text-sm">
              Delay (minutes)
            </Label>
            <Input
              id="delay"
              type="number"
              min="1"
              max="1440"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              className="cyber-input"
            />
          </div>
        )}

        {schedulingMode === 'specific' && (
          <div className="space-y-2">
            <Label htmlFor="datetime" className="text-sm">
              Execution Date & Time
            </Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={specificDateTime}
              onChange={(e) => setSpecificDateTime(e.target.value)}
              className="cyber-input"
            />
          </div>
        )}

        <div className="p-2 bg-cyber-dark/50 rounded border border-cyber-accent/20">
          <div className="text-xs text-muted-foreground mb-1">
            Will execute: <span className="text-cyber-accent">{formatExecutionTime()}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Function: <span className="font-mono">{functionDetails?.name || 'Unknown'}</span>
          </div>
        </div>

        <Button 
          onClick={handleScheduleTransaction}
          disabled={isScheduling || !contractAddress || !functionSignature}
          className="w-full cyber-button"
        >
          {isScheduling ? 'Scheduling...' : 'Schedule Transaction'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TimerScheduler;
