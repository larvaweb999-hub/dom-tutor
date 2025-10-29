'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, User, FileText, Download, Upload, Key } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [configData, setConfigData] = useState('');

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/user/profile', profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleExportConfig = async () => {
    try {
      const response = await apiClient.get('/export-config');
      const config = JSON.stringify(response.data, null, 2);
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-dom-tutor-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Configuration exported successfully');
    } catch (error) {
      toast.error('Failed to export configuration');
    }
  };

  const handleImportConfig = async () => {
    try {
      const config = JSON.parse(configData);
      await apiClient.post('/import-config', config);
      toast.success('Configuration imported successfully');
      setConfigData('');
    } catch (error) {
      toast.error('Failed to import configuration - please check the format');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <Settings className="mr-3 h-8 w-8 text-slate-600" />
            Settings
          </h1>
          <p className="text-slate-600 mt-1">
            Manage your account and configuration settings
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2 text-emerald-600" />
                Browser Extension
              </CardTitle>
              <CardDescription>
                Configuration for browser extension access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Extension Setup</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Your browser extension will automatically sync with these settings when you're logged in.
                </p>
                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="text-blue-600 font-medium">User ID:</span>
                    <code className="ml-2 bg-white px-2 py-1 rounded">{user?.id}</code>
                  </div>
                  <div className="text-xs">
                    <span className="text-blue-600 font-medium">API Endpoint:</span>
                    <code className="ml-2 bg-white px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Import/Export */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Configuration Management
            </CardTitle>
            <CardDescription>
              Import and export your complete AI DOM Tutor configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Export Configuration</h4>
                <p className="text-sm text-slate-600">
                  Download your complete configuration including languages, AI providers, and settings.
                </p>
                <Button onClick={handleExportConfig} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Import Configuration</h4>
                <p className="text-sm text-slate-600">
                  Upload a previously exported configuration file to restore your settings.
                </p>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste your configuration JSON here..."
                    value={configData}
                    onChange={(e) => setConfigData(e.target.value)}
                    rows={4}
                  />
                  <Button 
                    onClick={handleImportConfig} 
                    variant="outline" 
                    className="w-full"
                    disabled={!configData.trim()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Config
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}