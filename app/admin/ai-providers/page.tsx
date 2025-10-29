'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit2, Trash2, MoreVertical, Bot, Key, Globe, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface AIProvider {
  id: number;
  name: string;
  api_url: string;
  model: string;
  logo_url?: string;
  languages_supported: string[];
  created_at: string;
}

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    api_url: '',
    api_key: '',
    model: '',
    logo_url: '',
    languages_supported: '',
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await apiClient.get('/ai-providers');
      setProviders(response.data.providers || []);
    } catch (error) {
      toast.error('Failed to load AI providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      languages_supported: formData.languages_supported.split(',').map(lang => lang.trim()).filter(Boolean),
    };

    try {
      if (editingProvider) {
        await apiClient.put(`/ai-providers/${editingProvider.id}`, submitData);
        toast.success('AI provider updated successfully');
      } else {
        await apiClient.post('/ai-providers', submitData);
        toast.success('AI provider created successfully');
      }
      
      await loadProviders();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save AI provider');
    }
  };

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      api_url: provider.api_url,
      api_key: '', // Don't prefill API key for security
      model: provider.model,
      logo_url: provider.logo_url || '',
      languages_supported: provider.languages_supported.join(', '),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (provider: AIProvider) => {
    if (!confirm(`Are you sure you want to delete ${provider.name}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/ai-providers/${provider.id}`);
      toast.success('AI provider deleted successfully');
      await loadProviders();
    } catch (error) {
      toast.error('Failed to delete AI provider');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      api_url: '',
      api_key: '',
      model: '',
      logo_url: '',
      languages_supported: '',
    });
    setEditingProvider(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200 rounded-lg"></div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center">
              <Bot className="mr-3 h-8 w-8 text-emerald-600" />
              AI Providers
            </h1>
            <p className="text-slate-600 mt-1">
              Configure AI models and API connections for your tutor
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProvider ? 'Edit AI Provider' : 'Add New AI Provider'}
                </DialogTitle>
                <DialogDescription>
                  Configure an AI provider for generating tutoring instructions
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Provider Name</Label>
                    <Input
                      id="name"
                      placeholder="OpenAI, Anthropic..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="gpt-4, claude-3..."
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_url">API URL</Label>
                  <Input
                    id="api_url"
                    placeholder="https://api.openai.com/v1/..."
                    value={formData.api_url}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    placeholder="Your API key (encrypted in database)"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    required={!editingProvider}
                  />
                  {editingProvider && (
                    <p className="text-xs text-slate-500">Leave empty to keep current API key</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL (optional)</Label>
                  <Input
                    id="logo_url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="languages_supported">Supported Languages</Label>
                  <Textarea
                    id="languages_supported"
                    placeholder="en, es, fr, de (comma-separated)"
                    value={formData.languages_supported}
                    onChange={(e) => setFormData({ ...formData, languages_supported: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProvider ? 'Update' : 'Create'} Provider
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {providers.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No AI providers configured</h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Connect to AI providers like OpenAI, Anthropic, or others to power your DOM tutor with intelligent instructions.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Provider
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Card key={provider.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {provider.logo_url ? (
                        <img 
                          src={provider.logo_url} 
                          alt={provider.name}
                          className="w-6 h-6 rounded"
                        />
                      ) : (
                        <Bot className="w-6 h-6 text-emerald-600" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {provider.model}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(provider)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(provider)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-xl">{provider.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Globe className="h-4 w-4" />
                      <span className="truncate">{provider.api_url}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Key className="h-4 w-4" />
                      <span>API Key configured</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {provider.languages_supported.slice(0, 3).map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang.toUpperCase()}
                        </Badge>
                      ))}
                      {provider.languages_supported.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{provider.languages_supported.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Added {new Date(provider.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}