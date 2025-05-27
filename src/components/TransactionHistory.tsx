
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export interface Transaction {
  id: string;
  hash: string;
  functionName: string;
  contractAddress: string;
  value: string;
  status: 'pending' | 'success' | 'error' | 'cancelled';
  timestamp: number;
  error?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'success':
        return <Badge variant="cyber" className="bg-green-500/20 text-green-400">Success</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400">Error</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/20 text-gray-400">Cancelled</Badge>;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center p-6 border border-dashed border-cyber-border rounded-md">
        <p className="text-cyber-text-muted">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.slice(0, 10).map((tx) => (
        <Card key={tx.id} className="cyber-panel bg-cyber-dark/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getStatusIcon(tx.status)}
                <div className="space-y-1">
                  <div className="font-mono text-sm font-medium text-cyber-text">
                    {tx.functionName}
                  </div>
                  <div className="text-xs text-cyber-text-muted">
                    Contract: {tx.contractAddress.slice(0, 6)}...{tx.contractAddress.slice(-4)}
                  </div>
                  {tx.value && tx.value !== '0' && (
                    <div className="text-xs text-cyber-secondary">
                      Value: {tx.value} ETH
                    </div>
                  )}
                  <div className="text-xs text-cyber-text-muted">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                  {tx.error && (
                    <div className="text-xs text-red-400">
                      Error: {tx.error}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(tx.status)}
                {tx.hash && (
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyber-accent hover:text-cyber-accent-bright transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TransactionHistory;
