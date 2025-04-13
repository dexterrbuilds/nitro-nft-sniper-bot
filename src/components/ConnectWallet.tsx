
import React from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/contractUtils';

const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Find MetaMask connector
  const metamaskConnector = connectors.find(
    (connector) => connector.name === 'MetaMask'
  );

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded bg-cyber-dark border border-cyber-accent/30 text-sm font-mono">
          {ensName || shortenAddress(address as string)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="cyber-button-alt"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => metamaskConnector && connect({ connector: metamaskConnector })}
      disabled={isPending}
      className="cyber-button"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};

export default ConnectWallet;
