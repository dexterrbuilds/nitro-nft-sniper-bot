
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, Plus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getStoredAccessKeys, 
  generateAccessKey, 
  saveAccessKey, 
  deleteAccessKey,
  AccessKey 
} from '@/lib/accessKeyUtils';

const Admin: React.FC = () => {
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [newKeyType, setNewKeyType] = useState<'basic' | 'premium' | 'unlimited'>('basic');
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  const ADMIN_PASSWORD = 'NITRO_ADMIN_2024'; // In production, this should be environment variable

  useEffect(() => {
    if (isAuthenticated) {
      loadAccessKeys();
    }
  }, [isAuthenticated]);

  const loadAccessKeys = () => {
    const keys = getStoredAccessKeys();
    setAccessKeys(keys);
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid admin password');
    }
  };

  const handleGenerateKey = () => {
    const newKey = generateAccessKey(newKeyType);
    saveAccessKey(newKey);
    setAccessKeys(prev => [...prev, newKey]);
    toast.success(`${newKeyType.toUpperCase()} access key generated`);
  };

  const handleDeleteKey = (keyId: string) => {
    if (window.confirm('Are you sure you want to delete this access key?')) {
      deleteAccessKey(keyId);
      setAccessKeys(prev => prev.filter(k => k.id !== keyId));
      toast.success('Access key deleted');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Access key copied to clipboard');
  };

  const toggleShowKey = (keyId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getKeyTypeColor = (type: string) => {
    switch (type) {
      case 'basic': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      case 'unlimited': return 'bg-gold-500 bg-gradient-to-r from-yellow-400 to-yellow-600';
      default: return 'bg-gray-500';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6">
        <Card className="w-full max-w-md cyber-panel bg-cyber-dark border-cyber-accent/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-mono cyber-glow-text">
              Admin Panel
            </CardTitle>
            <CardDescription>
              Enter admin password to manage access keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin password..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              className="bg-cyber-dark border-cyber-accent/30"
            />
            <Button 
              onClick={handleAdminLogin}
              className="w-full bg-cyber-accent hover:bg-cyber-accent/80"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg p-6">
      <div className="container max-w-6xl mx-auto space-y-6">
        <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
          <CardHeader>
            <CardTitle className="text-2xl font-mono cyber-glow-text">
              NITRO NFT Admin Panel
            </CardTitle>
            <CardDescription>
              Manage access keys and monitor usage
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
          <CardHeader>
            <CardTitle className="font-mono">Generate New Access Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Key Type</label>
                <Select value={newKeyType} onValueChange={(value: any) => setNewKeyType(value)}>
                  <SelectTrigger className="bg-cyber-dark border-cyber-accent/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (30 days, 100 transactions)</SelectItem>
                    <SelectItem value="premium">Premium (90 days, 500 transactions)</SelectItem>
                    <SelectItem value="unlimited">Unlimited (365 days, unlimited)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerateKey}
                className="bg-cyber-accent hover:bg-cyber-accent/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Key
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-panel bg-cyber-dark border-cyber-accent/30">
          <CardHeader>
            <CardTitle className="font-mono">Access Keys ({accessKeys.length})</CardTitle>
            <CardDescription>
              Manage and monitor all generated access keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accessKeys.map((key) => (
                <div 
                  key={key.id}
                  className="flex items-center justify-between p-4 border border-cyber-accent/20 rounded-lg bg-cyber-dark/50"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getKeyTypeColor(key.keyType)} text-white`}>
                        {key.keyType.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Created: {formatDate(key.createdAt)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Expires: {formatDate(key.expiresAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-black/20 px-2 py-1 rounded font-mono">
                        {showPasswords[key.id] ? key.key : '••••••••••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShowKey(key.id)}
                      >
                        {showPasswords[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Device: {key.deviceId || 'Not bound'} | 
                      Usage: {key.usedTransactions}/{key.maxTransactions || '∞'} transactions
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyKey(key.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {accessKeys.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No access keys generated yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
