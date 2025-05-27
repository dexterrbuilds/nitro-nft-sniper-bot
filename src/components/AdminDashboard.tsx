
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Key, Plus, Shield, User } from 'lucide-react';

interface AccessKey {
  id: string;
  key_value: string;
  status: 'dormant' | 'activated' | 'revoked';
  username?: string;
  created_at: string;
  activated_at?: string;
  last_used_at?: string;
}

const AdminDashboard: React.FC = () => {
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchAccessKeys();
  }, []);

  const fetchAccessKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('access_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching access keys');
        return;
      }

      setAccessKeys(data || []);
    } catch (error) {
      console.error('Error fetching access keys:', error);
      toast.error('Error fetching access keys');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAccessKey = async () => {
    setIsGenerating(true);
    try {
      // Generate a new access key
      const keyValue = `NK-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      const { error } = await supabase
        .from('access_keys')
        .insert([
          {
            key_value: keyValue,
            status: 'dormant'
          }
        ]);

      if (error) {
        toast.error('Error generating access key');
        return;
      }

      toast.success(`Access key generated: ${keyValue}`);
      fetchAccessKeys();
    } catch (error) {
      console.error('Error generating access key:', error);
      toast.error('Error generating access key');
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeAccessKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('access_keys')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (error) {
        toast.error('Error revoking access key');
        return;
      }

      toast.success('Access key revoked');
      fetchAccessKeys();
    } catch (error) {
      console.error('Error revoking access key:', error);
      toast.error('Error revoking access key');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dormant':
        return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">Dormant</Badge>;
      case 'activated':
        return <Badge variant="cyber" className="bg-cyber-accent/20 text-cyber-accent">Activated</Badge>;
      case 'revoked':
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400">Revoked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-darker flex items-center justify-center">
        <div className="text-cyber-text">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-darker p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-cyber-accent" />
            <div>
              <h1 className="text-3xl font-bold cyber-glow-text">Admin Dashboard</h1>
              <p className="text-cyber-text-muted">Manage access keys and users</p>
            </div>
          </div>
          <Button 
            onClick={generateAccessKey}
            disabled={isGenerating}
            className="cyber-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Access Key'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="cyber-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cyber-text-muted">Total Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyber-text">{accessKeys.length}</div>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cyber-text-muted">Dormant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">
                {accessKeys.filter(k => k.status === 'dormant').length}
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cyber-text-muted">Activated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyber-accent">
                {accessKeys.filter(k => k.status === 'activated').length}
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cyber-text-muted">Revoked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {accessKeys.filter(k => k.status === 'revoked').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Keys Table */}
        <Card className="cyber-panel">
          <CardHeader>
            <CardTitle className="text-cyber-text">Access Keys Management</CardTitle>
            <CardDescription className="text-cyber-text-muted">
              View and manage all access keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-cyber-border">
                  <TableHead className="text-cyber-text">Key Value</TableHead>
                  <TableHead className="text-cyber-text">Status</TableHead>
                  <TableHead className="text-cyber-text">Username</TableHead>
                  <TableHead className="text-cyber-text">Created</TableHead>
                  <TableHead className="text-cyber-text">Activated</TableHead>
                  <TableHead className="text-cyber-text">Last Used</TableHead>
                  <TableHead className="text-cyber-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessKeys.map((key) => (
                  <TableRow key={key.id} className="border-cyber-border">
                    <TableCell className="font-mono text-cyber-text">{key.key_value}</TableCell>
                    <TableCell>{getStatusBadge(key.status)}</TableCell>
                    <TableCell className="text-cyber-text">
                      {key.username ? (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-cyber-secondary" />
                          <span>{key.username}</span>
                        </div>
                      ) : (
                        <span className="text-cyber-text-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-cyber-text-muted text-sm">
                      {formatDate(key.created_at)}
                    </TableCell>
                    <TableCell className="text-cyber-text-muted text-sm">
                      {formatDate(key.activated_at)}
                    </TableCell>
                    <TableCell className="text-cyber-text-muted text-sm">
                      {formatDate(key.last_used_at)}
                    </TableCell>
                    <TableCell>
                      {key.status !== 'revoked' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeAccessKey(key.id)}
                          className="text-xs"
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
