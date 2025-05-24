
import { toast } from 'sonner';

export interface ScheduledTransaction {
  id: string;
  functionName: string;
  contractAddress: string;
  args: any[];
  value: string;
  scheduledTime: number;
  executionCallback: () => Promise<void>;
}

let scheduledTransactions: ScheduledTransaction[] = [];
let timers: { [key: string]: NodeJS.Timeout } = {};

export const scheduleTransaction = (transaction: ScheduledTransaction): string => {
  // Add transaction to the queue
  scheduledTransactions.push(transaction);
  
  // Calculate time until execution in milliseconds
  const now = Date.now();
  const timeUntilExecution = transaction.scheduledTime - now;
  
  if (timeUntilExecution <= 0) {
    // Execute immediately if time has already passed
    executeTransaction(transaction.id);
    return transaction.id;
  }
  
  // Schedule execution
  timers[transaction.id] = setTimeout(() => {
    executeTransaction(transaction.id);
  }, timeUntilExecution);
  
  return transaction.id;
};

export const cancelScheduledTransaction = (id: string) => {
  // Clear the timeout
  if (timers[id]) {
    clearTimeout(timers[id]);
    delete timers[id];
  }
  
  // Remove from the queue
  scheduledTransactions = scheduledTransactions.filter(tx => tx.id !== id);
  
  return scheduledTransactions;
};

export const getScheduledTransactions = () => {
  return [...scheduledTransactions];
};

const executeTransaction = async (id: string) => {
  // Find the transaction
  const txIndex = scheduledTransactions.findIndex(tx => tx.id === id);
  if (txIndex === -1) {
    return;
  }
  
  const transaction = scheduledTransactions[txIndex];
  
  // Remove from queue
  scheduledTransactions.splice(txIndex, 1);
  
  // Clear timer
  if (timers[id]) {
    clearTimeout(timers[id]);
    delete timers[id];
  }
  
  try {
    // Execute the callback
    toast.info(`Executing scheduled transaction: ${transaction.functionName}`);
    await transaction.executionCallback();
    toast.success(`Scheduled transaction executed: ${transaction.functionName}`);
  } catch (error: any) {
    console.error('Failed to execute scheduled transaction:', error);
    toast.error(`Scheduled transaction failed: ${error.message || 'Unknown error'}`);
  }
};

export const clearAllScheduledTransactions = () => {
  // Clear all timeouts
  Object.values(timers).forEach(timer => clearTimeout(timer));
  
  // Reset state
  timers = {};
  scheduledTransactions = [];
};
