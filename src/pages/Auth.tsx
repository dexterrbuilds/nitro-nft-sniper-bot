
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Key, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AccessKeyLogin from '@/components/AccessKeyLogin';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAccessLogin, setShowAccessLogin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          toast.success('Admin account created! Please check your email for verification.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
        
        if (adminData) {
          toast.success('Admin login successful!');
          navigate('/admin');
        } else {
          toast.error('Access denied. Admin privileges required.');
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessSuccess = (username: string, accessKey: string) => {
    // Store access credentials in localStorage for the session
    localStorage.setItem('nitro_user', JSON.stringify({ username, accessKey }));
    navigate('/');
  };

  if (showAccessLogin) {
    return <AccessKeyLogin onSuccess={handleAccessSuccess} />;
  }

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="w-8 h-8 text-cyber-accent" />
            <h1 className="text-3xl font-bold cyber-glow-text">NITRO ADMIN</h1>
          </div>
          <p className="text-cyber-text-muted">Administrative Access Portal</p>
        </div>

        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid grid-cols-2 bg-cyber-dark border border-cyber-accent/30">
            <TabsTrigger value="login" className="font-mono">Admin Login</TabsTrigger>
            <TabsTrigger value="signup" className="font-mono">Admin Signup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-cyber-text">
                  <User className="w-5 h-5 text-cyber-accent" />
                  <span>Admin Login</span>
                </CardTitle>
                <CardDescription className="text-cyber-text-muted">
                  Sign in to your admin account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminAuth} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="cyber-input"
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cyber-input"
                    required
                  />
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full cyber-button"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-cyber-text">
                  <Shield className="w-5 h-5 text-cyber-secondary" />
                  <span>Admin Signup</span>
                </CardTitle>
                <CardDescription className="text-cyber-text-muted">
                  Create an admin account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { setIsSignUp(true); handleAdminAuth(e); }} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="cyber-input"
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cyber-input"
                    required
                  />
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full cyber-button"
                  >
                    {isLoading ? 'Creating account...' : 'Create Admin Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Button 
            variant="outline"
            onClick={() => setShowAccessLogin(true)}
            className="cyber-button-alt"
          >
            <Key className="w-4 h-4 mr-2" />
            User Access Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
