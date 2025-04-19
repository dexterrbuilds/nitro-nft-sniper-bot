
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateMerkleProof, verifyMerkleProof } from '@/lib/merkleUtils';
import { ethers } from 'ethers';

const MerkleProofGenerator = () => {
  const [address, setAddress] = useState('');
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [merkleRoot, setMerkleRoot] = useState('');
  const [merkleProof, setMerkleProof] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleAllowlistInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(e.target.value);
      if (Array.isArray(parsed)) {
        setAllowlist(parsed);
        return;
      }
    } catch {
      // If not JSON, try to split by newlines or commas
      const addresses = e.target.value
        .split(/[\n,]/)
        .map(addr => addr.trim())
        .filter(addr => addr && ethers.isAddress(addr));
      
      setAllowlist(addresses);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        if (Array.isArray(content)) {
          setAllowlist(content);
          toast.success('Allowlist loaded successfully');
        } else {
          toast.error('Invalid file format. Expected array of addresses');
        }
      } catch (error) {
        toast.error('Failed to parse allowlist file');
      }
    };
    reader.readAsText(file);
  };

  const generateProof = () => {
    if (!ethers.isAddress(address)) {
      toast.error('Please enter a valid wallet address');
      return;
    }

    if (allowlist.length === 0) {
      toast.error('Please provide an allowlist');
      return;
    }

    try {
      const { root, proof } = generateMerkleProof(address, allowlist);
      setMerkleRoot(root);
      setMerkleProof(proof);

      // Verify the proof
      const isValid = verifyMerkleProof(address, proof, root);
      if (isValid) {
        toast.success('Merkle proof generated successfully');
      } else {
        toast.error('Failed to verify generated proof');
      }
    } catch (error) {
      toast.error('Failed to generate Merkle proof');
      console.error(error);
    }
  };

  return (
    <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
      <CardHeader>
        <CardTitle className="text-xl font-mono cyber-glow-text">Merkle Proof Generator</CardTitle>
        <CardDescription>Generate Merkle proofs for allowlist verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wallet-address">Wallet Address</Label>
          <Input
            id="wallet-address"
            placeholder="0x..."
            value={address}
            onChange={handleAddressChange}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allowlist">
            Allowlist (JSON array or one address per line)
          </Label>
          <Textarea
            id="allowlist"
            placeholder='["0x123...", "0x456..."]'
            onChange={handleAllowlistInput}
            className="font-mono min-h-[120px]"
            value={allowlist.length > 0 ? JSON.stringify(allowlist, null, 2) : ''}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="cyber-button-alt"
            >
              Load from file
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <span className="text-xs text-muted-foreground">
              {allowlist.length} addresses loaded
            </span>
          </div>
        </div>

        <Button onClick={generateProof} className="w-full cyber-button">
          Generate Proof
        </Button>

        {merkleRoot && (
          <div className="space-y-2 p-4 border border-cyber-accent/30 rounded-md bg-cyber-dark/50">
            <div>
              <Label>Merkle Root</Label>
              <div className="font-mono text-xs break-all p-2 bg-black/30 rounded">
                {merkleRoot}
              </div>
            </div>
            <div>
              <Label>Merkle Proof</Label>
              <div className="font-mono text-xs break-all p-2 bg-black/30 rounded">
                {JSON.stringify(merkleProof, null, 2)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MerkleProofGenerator;
