
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getScheduledTransactions, cancelScheduledTransaction, ScheduledTransaction } from '@/lib/timerUtils';
import { Timer, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledTransactionsProps {
  onTransactionCancel?: (id: string) => void;
}

const ScheduledTransactions: React.FC<ScheduledTransactionsProps> = ({ 
  onTransactionCancel 
}) => {
  const [transactions, setTransactions] = useState<ScheduledTransaction[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  
  // Update transactions list and current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(getScheduledTransactions());
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleCancel = (id: string) => {
    cancelScheduledTransaction(id);
    setTransactions(getScheduledTransactions());
    if (onTransactionCancel) {
      onTransactionCancel(id);
    }
    toast.info('Scheduled transaction cancelled');
  };
  
  // Format time remaining
  const formatTimeRemaining = (scheduledTime: number) => {
    const timeRemaining = Math.max(0, scheduledTime - currentTime);
    const seconds = Math.floor((timeRemaining / 1000) % 60);
    const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
    const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format scheduled time
  const formatScheduledTime = (scheduledTime: number) => {
    const date = new Date(scheduledTime);
    return date.toLocaleTimeString();
  };
  
  if (transactions.length === 0) {
    return null;
  }
  
  return (
    <Card className="cyber-panel bg-cyber-dark border-amber-500/30 mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-sm">Scheduled Transactions</CardTitle>
        </div>
        <CardDescription>
          Scheduled transactions will execute automatically at the specified time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div 
              key={tx.id} 
              className="flex items-center justify-between p-2 border border-cyber-accent/20 rounded bg-cyber-dark/70"
            >
              <div className="flex-1">
                <div className="font-mono text-sm text-cyber-accent">
                  {tx.functionName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatScheduledTime(tx.scheduledTime)} 
                  <span className="ml-2 text-amber-500">
                    (in {formatTimeRemaining(tx.scheduledTime)})
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleCancel(tx.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledTransactions;
