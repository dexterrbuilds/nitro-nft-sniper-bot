
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { validateAccessKey, getDeviceFingerprint } from '@/lib/accessKeyUtils';

interface AccessKeyGuardProps {
  children: React.ReactNode;
}

const AccessKeyGuard: React.FC<AccessKeyGuardProps> = ({ children }) => {
  const [isValidated, setIsValidated] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user already has a valid session
    const checkExistingSession = async () => {
      const sessionData = localStorage.getItem('nitro-session');
      if (sessionData) {
        try {
          const { timestamp, deviceId, keyHash } = JSON.parse(sessionData);
          const currentTime = Date.now();
          const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

          // Check if session is still valid (within 24 hours)
          if (currentTime - timestamp < sessionDuration) {
            const currentDeviceId = await getDeviceFingerprint();
            
            // Verify device fingerprint matches
            if (deviceId === currentDeviceId) {
              setIsValidated(true);
              setIsChecking(false);
              return;
            }
          }
          
          // Clear invalid session
          localStorage.removeItem('nitro-session');
        } catch (e) {
          localStorage.removeItem('nitro-session');
        }
      }
      setIsChecking(false);
    };

    checkExistingSession();
  }, []);

  const handleValidateKey = async () => {
    if (!accessKey.trim()) {
      toast.error('Please enter an access key');
      return;
    }

    setIsLoading(true);
    
    try {
      const deviceId = await getDeviceFingerprint();
      const isValid = await validateAccessKey(accessKey, deviceId);
      
      if (isValid) {
        // Store session data
        const sessionData = {
          timestamp: Date.now(),
          deviceId,
          keyHash: btoa(accessKey) // Basic encoding for demo
        };
        localStorage.setItem('nitro-session', JSON.stringify(sessionData));
        
        setIsValidated(true);
        toast.success('Access key validated successfully!');
      } else {
        toast.error('Invalid access key or device mismatch');
      }
    } catch (error) {
      toast.error('Failed to validate access key');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="animate-pulse">
          <div className="text-xl font-mono cyber-glow-text">
            NITRO<span className="text-foreground">NFT</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidated) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6">
        <Card className="w-full max-w-md cyber-panel bg-cyber-dark border-cyber-accent/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-mono cyber-glow-text">
              NITRO<span className="text-foreground">NFT</span>
            </CardTitle>
            <CardDescription>
              Enter your access key to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="accessKey" className="text-sm font-medium">
                Access Key
              </label>
              <Input
                id="accessKey"
                type="password"
                placeholder="Enter your access key..."
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleValidateKey()}
                className="bg-cyber-dark border-cyber-accent/30"
              />
            </div>
            
            <Button 
              onClick={handleValidateKey}
              disabled={isLoading}
              className="w-full bg-cyber-accent hover:bg-cyber-accent/80"
            >
              {isLoading ? 'Validating...' : 'Validate Key'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Need an access key?</p>
              <p className="text-cyber-accent">Contact us to purchase access</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AccessKeyGuard;
