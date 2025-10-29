'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Play, RefreshCw, Languages, Bot, Volume2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface Language {
  id: number;
  code: string;
  label: string;
  tts_voice_tag: string;
  is_default: boolean;
}

interface AIProvider {
  id: number;
  name: string;
  model: string;
}

interface PreviewConfig {
  selectedLanguage: string;
  selectedProvider: string;
}

export default function PreviewPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [config, setConfig] = useState<PreviewConfig>({
    selectedLanguage: '',
    selectedProvider: '',
  });
  const [loading, setLoading] = useState(true);
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadPreviewData();
  }, []);

  const loadPreviewData = async () => {
    try {
      const [languagesRes, providersRes, configRes] = await Promise.all([
        apiClient.get('/languages'),
        apiClient.get('/ai-providers'),
        apiClient.get('/public-config')
      ]);

      const langs = languagesRes.data.languages || [];
      const provs = providersRes.data.providers || [];
      
      setLanguages(langs);
      setProviders(provs);
      
      // Set defaults from config
      const defaultLang = configRes.data.defaultLanguage?.code || (langs[0]?.code || '');
      const defaultProvider = configRes.data.activeProvider?.id?.toString() || (provs[0]?.id?.toString() || '');
      
      setConfig({
        selectedLanguage: defaultLang,
        selectedProvider: defaultProvider,
      });
    } catch (error) {
      toast.error('Failed to load preview data');
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    if (!config.selectedLanguage || !config.selectedProvider) {
      toast.error('Please select both a language and AI provider');
      return;
    }

    setTestRunning(true);
    setTestResult(null);

    try {
      const response = await apiClient.post('/generate-instruction', {
        elementLabel: 'Login Button',
        htmlContext: '<button class="btn btn-primary">Login</button>',
        languageCode: config.selectedLanguage,
        providerId: config.selectedProvider,
      });

      setTestResult(response.data.instruction || 'Test completed successfully!');
      toast.success('AI tutor test completed successfully');
    } catch (error) {
      toast.error('Test failed - please check your configuration');
    } finally {
      setTestRunning(false);
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
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-slate-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const selectedLanguage = languages.find(lang => lang.code === config.selectedLanguage);
  const selectedProvider = providers.find(prov => prov.id.toString() === config.selectedProvider);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <Eye className="mr-3 h-8 w-8 text-purple-600" />
            Preview & Test
          </h1>
          <p className="text-slate-600 mt-1">
            Test your AI DOM Tutor configuration in real-time
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Panel */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2 text-emerald-600" />
                Test Configuration
              </CardTitle>
              <CardDescription>
                Select language and AI provider for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select 
                  value={config.selectedLanguage} 
                  onValueChange={(value) => setConfig({ ...config, selectedLanguage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.id} value={language.code}>
                        <div className="flex items-center space-x-2">
                          <Languages className="h-4 w-4" />
                          <span>{language.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {language.code.toUpperCase()}
                          </Badge>
                          {language.is_default && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-800">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">AI Provider</label>
                <Select 
                  value={config.selectedProvider} 
                  onValueChange={(value) => setConfig({ ...config, selectedProvider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <span>{provider.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {provider.model}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLanguage && (
                <Card className="bg-slate-50 border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Volume2 className="h-4 w-4 text-slate-600" />
                      <span className="text-slate-600">TTS Voice:</span>
                      <code className="text-xs bg-white px-2 py-1 rounded">
                        {selectedLanguage.tts_voice_tag}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={runTest} 
                className="w-full" 
                disabled={testRunning || !config.selectedLanguage || !config.selectedProvider}
              >
                {testRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run AI Tutor Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-purple-600" />
                Test Results
              </CardTitle>
              <CardDescription>
                Output from your AI tutor configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!testResult && !testRunning ? (
                <div className="text-center py-8 text-slate-500">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Run a test to see AI tutor output</p>
                </div>
              ) : testRunning ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-600" />
                  <p className="text-slate-600">Testing your AI tutor...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">AI Instruction Generated:</h4>
                    <p className="text-sm text-green-700">{testResult}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Language:</span>
                      <p className="font-medium">{selectedLanguage?.label}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Provider:</span>
                      <p className="font-medium">{selectedProvider?.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Browser Extension Preview */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Browser Extension Preview</CardTitle>
            <CardDescription>
              This is how your AI DOM Tutor will appear to users in their browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-100 rounded-lg p-6 min-h-[300px] flex items-center justify-center">
              <div className="text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Eye className="h-8 w-8" />
                </div>
                <h3 className="font-medium mb-2">Browser Extension Preview</h3>
                <p className="text-sm">
                  Interactive preview will be implemented here showing the actual browser extension interface
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}