
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Key, User, Shield } from 'lucide-react';
import PrivateKeyInput from './PrivateKeyInput';

interface AccessKeyLoginProps {
  onSuccess: (username: string, accessKey: string) => void;
}

const AccessKeyLogin: React.FC<AccessKeyLoginProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'access-key' | 'username' | 'private-key'>('access-key');
  const [accessKey, setAccessKey] = useState('');
  const [username, setUsername] = useState('');
  const [keyData, setKeyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateAccessKey = async () => {
    if (!accessKey.trim()) {
      toast.error('Please enter an access key');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('access_keys')
        .select('*')
        .eq('key_value', accessKey.trim())
        .single();

      if (error || !data) {
        toast.error('Invalid access key');
        return;
      }

      if (data.status === 'revoked') {
        toast.error('This access key has been revoked');
        return;
      }

      setKeyData(data);

      if (data.status === 'dormant') {
        // First time use - need username
        setStep('username');
      } else if (data.status === 'activated' && data.username) {
        // Already activated - proceed to private key
        setUsername(data.username);
        setStep('private-key');
      }
    } catch (error) {
      console.error('Error validating access key:', error);
      toast.error('Error validating access key');
    } finally {
      setIsLoading(false);
    }
  };

  const setUsernameAndActivate = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('access_keys')
        .update({
          username: username.trim(),
          status: 'activated',
          activated_at: new Date().toISOString()
        })
        .eq('id', keyData.id);

      if (error) {
        toast.error('Error setting username');
        return;
      }

      toast.success('Username set successfully!');
      setStep('private-key');
    } catch (error) {
      console.error('Error setting username:', error);
      toast.error('Error setting username');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivateKeyConnect = async (address: string) => {
    try {
      // Update last used timestamp
      await supabase
        .from('access_keys')
        .update({
          last_used_at: new Date().toISOString()
        })
        .eq('id', keyData.id);

      toast.success(`Welcome, ${username}!`);
      onSuccess(username, accessKey);
    } catch (error) {
      console.error('Error updating access key:', error);
    }
  };

  const handleReturnLogin = async () => {
    if (!accessKey.trim() || !username.trim()) {
      toast.error('Please enter both access key and username');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('access_keys')
        .select('*')
        .eq('key_value', accessKey.trim())
        .eq('username', username.trim())
        .eq('status', 'activated')
        .single();

      if (error || !data) {
        toast.error('Invalid access key or username combination');
        return;
      }

      setKeyData(data);
      setStep('private-key');
    } catch (error) {
      console.error('Error validating credentials:', error);
      toast.error('Error validating credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="w-8 h-8 text-cyber-accent" />
            <h1 className="text-3xl font-bold cyber-glow-text">NITRO ACCESS</h1>
          </div>
          <p className="text-cyber-text-muted">Secure NFT Sniper Platform</p>
        </div>

        {step === 'access-key' && (
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-cyber-text">
                <Key className="w-5 h-5 text-cyber-accent" />
                <span>Access Key Required</span>
              </CardTitle>
              <CardDescription className="text-cyber-text-muted">
                Enter your access key to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="NK-XXXXXXXXXXXXXXXX"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="cyber-input font-mono"
              />
              <Button 
                onClick={validateAccessKey}
                disabled={isLoading}
                className="w-full cyber-button"
              >
                {isLoading ? 'Validating...' : 'Validate Access Key'}
              </Button>
              
              <div className="mt-6 pt-4 border-t border-cyber-border">
                <p className="text-sm text-cyber-text-muted mb-3">Returning user?</p>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="cyber-input"
                  />
                  <Button 
                    onClick={handleReturnLogin}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full cyber-button-alt"
                  >
                    {isLoading ? 'Logging in...' : 'Login with Username'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'username' && (
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-cyber-text">
                <User className="w-5 h-5 text-cyber-secondary" />
                <span>Set Username</span>
              </CardTitle>
              <CardDescription className="text-cyber-text-muted">
                Choose a username for your account (first time setup)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="cyber-input"
              />
              <Button 
                onClick={setUsernameAndActivate}
                disabled={isLoading}
                className="w-full cyber-button"
              >
                {isLoading ? 'Setting up...' : 'Set Username & Continue'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'private-key' && (
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-cyber-text">
                <Shield className="w-5 h-5 text-cyber-secondary" />
                <span>Welcome, {username}</span>
              </CardTitle>
              <CardDescription className="text-cyber-text-muted">
                Connect your wallet to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrivateKeyInput onConnect={handlePrivateKeyConnect} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AccessKeyLogin;
