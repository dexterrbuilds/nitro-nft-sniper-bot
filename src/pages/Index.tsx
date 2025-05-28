
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import AdminDashboard from '@/components/AdminDashboard';

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [activeTab, setActiveTab] = useState('new');

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (adminData) {
          setIsAdmin(true);
        }
      }
    };
    checkAuth();
  }, []);

  const handleNewUserAuth = async () => {
    if (!accessKey.trim()) {
      toast.error('Please enter an access key');
      return;
    }

    setLoading(true);
    try {
      // Check if access key exists and is valid
      const { data: keyData, error: keyError } = await supabase
        .from('access_keys')
        .select('*')
        .eq('key_value', accessKey)
        .eq('status', 'activated')
        .single();

      if (keyError || !keyData) {
        toast.error('Invalid or inactive access key');
        setLoading(false);
        return;
      }

      // Create a dummy email for Supabase auth using the access key
      const email = `${accessKey}@nftsniper.local`;
      
      // Try to sign up or sign in
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: accessKey,
      });

      if (authError && authError.message.includes('already registered')) {
        // User exists, try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: accessKey,
        });

        if (signInError) {
          toast.error('Authentication failed');
          setLoading(false);
          return;
        }
      } else if (authError) {
        toast.error('Authentication failed');
        setLoading(false);
        return;
      }

      // Check if this user should be admin
      if (keyData.username === 'admin_user') {
        setIsAdmin(true);
      }

      setIsAuthenticated(true);
      toast.success('Authentication successful!');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReturningUserAuth = async () => {
    if (!username.trim() || !accessKey.trim()) {
      toast.error('Please enter both username and access key');
      return;
    }

    setLoading(true);
    try {
      // Check if access key matches username
      const { data: keyData, error: keyError } = await supabase
        .from('access_keys')
        .select('*')
        .eq('key_value', accessKey)
        .eq('username', username)
        .eq('status', 'activated')
        .single();

      if (keyError || !keyData) {
        toast.error('Invalid username or access key');
        setLoading(false);
        return;
      }

      // Sign in using the access key
      const email = `${accessKey}@nftsniper.local`;
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: accessKey,
      });

      if (signInError) {
        toast.error('Authentication failed');
        setLoading(false);
        return;
      }

      // Check if this user should be admin
      if (keyData.username === 'admin_user') {
        setIsAdmin(true);
      }

      setIsAuthenticated(true);
      toast.success('Welcome back!');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUsername('');
    setAccessKey('');
    setActiveTab('new');
    toast.success('Logged out successfully');
  };

  if (isAuthenticated) {
    if (isAdmin) {
      return <AdminDashboard onLogout={handleLogout} />;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/80 border-purple-500/30 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              NFT Sniper Dashboard
            </CardTitle>
            <CardDescription className="text-gray-300">
              Welcome to your NFT sniping dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/admin')} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Go to Sniper Bot
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/80 border-purple-500/30 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            NFT Sniper Bot
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter your access credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
              <TabsTrigger 
                value="new" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                New User
              </TabsTrigger>
              <TabsTrigger 
                value="returning" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Returning User
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="new-access-key" className="text-sm font-medium text-gray-300">
                  Access Key
                </Label>
                <Input
                  id="new-access-key"
                  type="text"
                  placeholder="Enter your access key"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="bg-gray-800/50 border-purple-500/30 text-white placeholder-gray-400"
                />
              </div>
              <Button 
                onClick={handleNewUserAuth}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? 'Authenticating...' : 'Access Bot'}
              </Button>
            </TabsContent>
            
            <TabsContent value="returning" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-300">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-800/50 border-purple-500/30 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returning-access-key" className="text-sm font-medium text-gray-300">
                  Access Key (Password)
                </Label>
                <Input
                  id="returning-access-key"
                  type="password"
                  placeholder="Enter your access key"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="bg-gray-800/50 border-purple-500/30 text-white placeholder-gray-400"
                />
              </div>
              <Button 
                onClick={handleReturningUserAuth}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-purple-500/20">
            <p className="text-xs text-gray-400 mb-2">Test Credentials:</p>
            <p className="text-xs text-purple-300">Admin: NK-ADMIN1234TESTKEY567</p>
            <p className="text-xs text-purple-300">User: NK-USER9876TESTKEY543 (username: test_user)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
