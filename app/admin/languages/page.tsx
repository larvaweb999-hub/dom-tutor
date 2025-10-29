'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit2, Trash2, MoreVertical, Volume2, Star, Languages as LanguagesIcon } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface Language {
  id: number;
  code: string;
  label: string;
  tts_voice_tag: string;
  is_default: boolean;
  created_at: string;
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    tts_voice_tag: '',
    is_default: false,
  });

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await apiClient.get('/languages');
      setLanguages(response.data.languages || []);
    } catch (error) {
      toast.error('Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLanguage) {
        await apiClient.put(`/languages/${editingLanguage.id}`, formData);
        toast.success('Language updated successfully');
      } else {
        await apiClient.post('/languages', formData);
        toast.success('Language created successfully');
      }
      
      await loadLanguages();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save language');
    }
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    setFormData({
      code: language.code,
      label: language.label,
      tts_voice_tag: language.tts_voice_tag,
      is_default: language.is_default,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (language: Language) => {
    if (!confirm(`Are you sure you want to delete ${language.label}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/languages/${language.id}`);
      toast.success('Language deleted successfully');
      await loadLanguages();
    } catch (error) {
      toast.error('Failed to delete language');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      label: '',
      tts_voice_tag: '',
      is_default: false,
    });
    setEditingLanguage(null);
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
                <div className="h-40 bg-slate-200 rounded-lg"></div>
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
              <LanguagesIcon className="mr-3 h-8 w-8 text-blue-600" />
              Languages
            </h1>
            <p className="text-slate-600 mt-1">
              Configure the languages your AI DOM Tutor supports
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Language
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLanguage ? 'Edit Language' : 'Add New Language'}
                </DialogTitle>
                <DialogDescription>
                  Configure a language for your AI tutor with TTS support
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Language Code</Label>
                    <Input
                      id="code"
                      placeholder="en, es, fr..."
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Display Name</Label>
                    <Input
                      id="label"
                      placeholder="English, Spanish..."
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tts_voice_tag">TTS Voice Tag</Label>
                  <Input
                    id="tts_voice_tag"
                    placeholder="en-US-female, es-ES-male..."
                    value={formData.tts_voice_tag}
                    onChange={(e) => setFormData({ ...formData, tts_voice_tag: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Set as default language</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingLanguage ? 'Update' : 'Create'} Language
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {languages.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <LanguagesIcon className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No languages configured</h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Add your first language to start configuring your AI DOM Tutor. You can set up multiple languages with different TTS voices.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Language
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {languages.map((language) => (
              <Card key={language.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {language.code.toUpperCase()}
                      </Badge>
                      {language.is_default && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(language)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(language)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-xl">{language.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Volume2 className="h-4 w-4" />
                      <span>TTS: {language.tts_voice_tag}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Created {new Date(language.created_at).toLocaleDateString()}
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