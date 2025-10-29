'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Languages, Bot, Eye, Activity, Plus, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  languagesCount: number;
  aiProvidersCount: number;
  defaultLanguage?: {
    code: string;
    label: string;
  };
  activeProvider?: {
    name: string;
    model: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    languagesCount: 0,
    aiProvidersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [languagesRes, providersRes, configRes] = await Promise.all([
        apiClient.get('/languages'),
        apiClient.get('/ai-providers'),
        apiClient.get('/public-config')
      ]);

      setStats({
        languagesCount: languagesRes.data.languages?.length || 0,
        aiProvidersCount: providersRes.data.providers?.length || 0,
        defaultLanguage: configRes.data.defaultLanguage,
        activeProvider: configRes.data.activeProvider,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-slate-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-slate-600 mt-1">
            Manage your AI DOM Tutor configuration and monitor your assistant's performance.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Languages</CardTitle>
              <Languages className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.languagesCount}</div>
              <p className="text-xs text-slate-500 mt-1">
                Configured languages
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">AI Providers</CardTitle>
              <Bot className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.aiProvidersCount}</div>
              <p className="text-xs text-slate-500 mt-1">
                Connected providers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Default Language</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-900">
                {stats.defaultLanguage?.label || 'None'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.defaultLanguage?.code?.toUpperCase() || 'Not configured'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Provider</CardTitle>
              <Eye className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-900">
                {stats.activeProvider?.name || 'None'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.activeProvider?.model || 'Not configured'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Languages className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Manage Languages</CardTitle>
                  <CardDescription>
                    Configure supported languages and TTS voices
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="ghost" 
                className="w-full justify-between group-hover:bg-blue-50 transition-colors"
                onClick={() => router.push('/admin/languages')}
              >
                {stats.languagesCount === 0 ? 'Add First Language' : 'Manage Languages'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <Bot className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Providers</CardTitle>
                  <CardDescription>
                    Configure AI models and API connections
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="ghost" 
                className="w-full justify-between group-hover:bg-emerald-50 transition-colors"
                onClick={() => router.push('/admin/ai-providers')}
              >
                {stats.aiProvidersCount === 0 ? 'Add First Provider' : 'Manage Providers'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Test Preview</CardTitle>
                  <CardDescription>
                    Try your AI tutor in a live environment
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="ghost" 
                className="w-full justify-between group-hover:bg-purple-50 transition-colors"
                onClick={() => router.push('/admin/preview')}
              >
                Launch Preview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Setup Status */}
        {(stats.languagesCount === 0 || stats.aiProvidersCount === 0) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Setup Required
              </CardTitle>
              <CardDescription className="text-orange-700">
                Complete your configuration to start using AI DOM Tutor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">Languages configured</span>
                <Badge variant={stats.languagesCount > 0 ? "default" : "secondary"}>
                  {stats.languagesCount > 0 ? 'Complete' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">AI providers connected</span>
                <Badge variant={stats.aiProvidersCount > 0 ? "default" : "secondary"}>
                  {stats.aiProvidersCount > 0 ? 'Complete' : 'Pending'}
                </Badge>
              </div>
              {stats.languagesCount === 0 && (
                <Button 
                  className="w-full mt-3" 
                  onClick={() => router.push('/admin/languages')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Language
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}