
import React from 'react';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/lib/web3Config';
import ConnectWallet from './ConnectWallet';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <div className="min-h-screen bg-cyber-bg text-foreground">
        <header className="py-4 px-6 border-b border-cyber-accent/20">
          <div className="container max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono tracking-tighter cyber-glow-text">
                NITRO<span className="text-foreground">NFT</span>
              </h1>
              <span className="text-xs px-2 py-0.5 bg-cyber-accent/20 rounded-full text-cyber-accent uppercase font-mono">
                Beta
              </span>
            </div>
            <ConnectWallet />
          </div>
        </header>
        
        <main className="container max-w-6xl mx-auto py-8 px-6">
          {children}
        </main>
        
        <footer className="py-6 px-6 border-t border-cyber-accent/20 text-center text-sm text-muted-foreground">
          <div className="container max-w-6xl mx-auto">
            <p className="font-mono">NITRO-NFT Sniper ⚡ Fast contract interaction for EVM chains</p>
          </div>
        </footer>
      </div>
    </WagmiConfig>
  );
};

export default Layout;
