
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { shortenAddress } from '@/lib/contractUtils';

export type Transaction = {
  id: string;
  hash: string;
  functionName: string;
  contractAddress: string;
  value: string;
  status: 'pending' | 'success' | 'error';
  timestamp: number;
};

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div className="cyber-panel bg-cyber-dark/50 p-3 text-sm">
        <p className="text-muted-foreground italic">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="cyber-panel bg-cyber-dark/70 p-3 border-l-4 hover:bg-cyber-dark/90 transition-colors"
          style={{ 
            borderLeftColor: 
              tx.status === 'success' ? '#00ffc8' : 
              tx.status === 'error' ? '#f87171' : 
              '#ffcc00' 
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-mono text-sm font-medium mb-1">{tx.functionName}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {shortenAddress(tx.contractAddress)}
              </div>
            </div>
            <Badge
              variant="outline"
              className={`
                font-mono text-xs capitalize 
                ${tx.status === 'success' ? 'border-cyber-accent text-cyber-accent' : 
                  tx.status === 'error' ? 'border-destructive text-destructive' : 
                  'border-cyber-warning text-cyber-warning'}
              `}
            >
              {tx.status}
            </Badge>
          </div>
          
          {tx.hash && (
            <div className="mt-2 text-xs">
              <a
                href={`https://etherscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-accent hover:underline font-mono"
              >
                {shortenAddress(tx.hash)} ↗
              </a>
            </div>
          )}
          
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {tx.value !== '0' ? `${tx.value} ETH` : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(tx.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;
