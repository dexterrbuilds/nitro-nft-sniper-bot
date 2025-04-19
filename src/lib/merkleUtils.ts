
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

export const generateMerkleProof = (address: string, allowlist: string[]): { root: string; proof: string[] } => {
  // Convert addresses to lowercase
  const normalizedAllowlist = allowlist.map(addr => addr.toLowerCase());
  const normalizedAddress = address.toLowerCase();
  
  // Create leaf nodes
  const leaves = normalizedAllowlist.map(addr => keccak256(addr));
  
  // Create Merkle Tree
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  
  // Get root
  const root = tree.getHexRoot();
  
  // Get proof for the given address
  const leaf = keccak256(normalizedAddress);
  const proof = tree.getHexProof(leaf);
  
  return { root, proof };
};

export const verifyMerkleProof = (address: string, proof: string[], root: string): boolean => {
  const normalizedAddress = address.toLowerCase();
  const leaf = keccak256(normalizedAddress);
  const tree = new MerkleTree([], keccak256, { sortPairs: true });
  
  return tree.verify(proof, leaf, root);
};
