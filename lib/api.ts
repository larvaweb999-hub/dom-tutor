import { supabase, getCurrentUser, isSupabaseConfigured, type Language, type AIProvider } from './supabase';
import { toast } from 'sonner';

// Demo user data for offline mode (fallback)
const DEMO_USER = {
  id: '1',
  name: 'Demo User',
  email: 'demo@example.com',
  created_at: new Date().toISOString(),
};

const DEMO_CREDENTIALS = {
  email: 'demo@example.com',
  password: 'demo123',
};

class ApiClient {
  private isSupabaseReady: boolean = false;

  constructor() {
    // Only check Supabase availability in browser
    if (typeof window !== 'undefined') {
      this.isSupabaseReady = isSupabaseConfigured();
    }
  }

  private async handleSupabaseAuth() {
    if (!this.isSupabaseReady || !supabase || typeof window === 'undefined') {
      throw new Error('Supabase not configured');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }
    return session;
  }

  // Authentication methods
  async login(email: string, password: string) {
    if (typeof window === 'undefined') {
      throw new Error('Authentication only available in browser');
    }

    if (!this.isSupabaseReady || !supabase) {
      return this.handleDemoLogin(email, password);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Transform Supabase user to our format
      const user = {
        id: data.user?.id || '',
        name: data.user?.user_metadata?.name || data.user?.email?.split('@')[0] || 'User',
        email: data.user?.email || '',
        created_at: data.user?.created_at || new Date().toISOString(),
      };

      return { user, authenticated: true };
    } catch (error) {
      console.error('Supabase login error:', error);
      throw error;
    }
  }

  async register(name: string, email: string, password: string) {
    if (typeof window === 'undefined') {
      throw new Error('Authentication only available in browser');
    }

    if (!this.isSupabaseReady || !supabase) {
      return this.handleDemoRegister(name, email, password);
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // Transform Supabase user to our format
      const user = {
        id: data.user?.id || '',
        name: name,
        email: data.user?.email || '',
        created_at: data.user?.created_at || new Date().toISOString(),
      };

      return { user, authenticated: true };
    } catch (error) {
      console.error('Supabase register error:', error);
      throw error;
    }
  }

  async logout() {
    if (typeof window === 'undefined') {
      return { success: true };
    }

    if (!this.isSupabaseReady || !supabase) {
      localStorage.removeItem('demo_user');
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Supabase logout error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    if (typeof window === 'undefined') {
      return { user: null, authenticated: false };
    }

    if (!this.isSupabaseReady || !supabase) {
      const savedUser = localStorage.getItem('demo_user');
      if (savedUser) {
        try {
          return { user: JSON.parse(savedUser), authenticated: true };
        } catch (e) {
          localStorage.removeItem('demo_user');
        }
      }
      return { user: null, authenticated: false };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { user: null, authenticated: false };
      }

      // Transform Supabase user to our format
      const transformedUser = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString(),
      };

      return { user: transformedUser, authenticated: true };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, authenticated: false };
    }
  }

  // Languages CRUD
  async getLanguages() {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return this.getDemoLanguages();
    }

    try {
      await this.handleSupabaseAuth();
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      if (error) throw error;
      return { languages: data || [] };
    } catch (error) {
      console.error('Get languages error:', error);
      return this.getDemoLanguages();
    }
  }

  async createLanguage(languageData: Omit<Language, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return { success: true, message: 'Language created (demo mode)' };
    }

    try {
      await this.handleSupabaseAuth();
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');

      // If this is set as default, unset other defaults first
      if (languageData.is_default) {
        await supabase
          .from('languages')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('languages')
        .insert({
          ...languageData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Create language error:', error);
      throw error;
    }
  }

  async updateLanguage(id: string, languageData: Partial<Omit<Language, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return { success: true, message: 'Language updated (demo mode)' };
    }

    try {
      await this.handleSupabaseAuth();
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');

      // If this is set as default, unset other defaults first
      if (languageData.is_default) {
        await supabase
          .from('languages')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('languages')
        .update(languageData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update language error:', error);
      throw error;
    }
  }

  async deleteLanguage(id: string) {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return { success: true, message: 'Language deleted (demo mode)' };
    }

    try {
      await this.handleSupabaseAuth();
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete language error:', error);
      throw error;
    }
  }

  // AI Providers CRUD
  async getAIProviders() {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return this.getDemoAIProviders();
    }

    try {
      await this.handleSupabaseAuth();
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('ai_providers')
        .select('id, name, api_url, model, logo_url, languages_supported, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at');

      if (error) throw error;
      return { providers: data || [] };
    } catch (error) {
      console.error('Get AI providers error:', error);
      return this.getDemoAIProviders();
    }
  }

  async createAIProvider(providerData: Omit<AIProvider, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { api_key: string }) {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return { success: true, message: 'AI Provider created (demo mode)' };
    }

    try {
      await this.handleSupabaseAuth();
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');

      const { api_key, ...restData } = providerData;

      const { data, error } = await supabase
        .from('ai_providers')
        .insert({
          ...restData,
          api_key_encrypted: api_key, // In production, encrypt this
          user_id: user.id,
        })
        .select('id, name, api_url, model, logo_url, languages_supported, created_at, updated_at')
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Create AI provider error:', error);
      throw error;
    }
  }

  async updateAIProvider(id: string, providerData: Partial<Omit<AIProvider, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { api_key?: string }) {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return { success: true, message: 'AI Provider updated (demo mode)' };
    }

    try {
      await this.handleSupabaseAuth();
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');

      const { api_key, ...restData } = providerData;
      const updateData: any = restData;

      if (api_key) {
        updateData.api_key_encrypted = api_key; // In production, encrypt this
      }

      const { data, error } = await supabase
        .from('ai_providers')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, name, api_url, model, logo_url, languages_supported, created_at, updated_at')
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update AI provider error:', error);
      throw error;
    }
  }

  async deleteAIProvider(id: string) {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return { success: true, message: 'AI Provider deleted (demo mode)' };
    }

    try {
      await this.handleSupabaseAuth();
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete AI provider error:', error);
      throw error;
    }
  }

  // Configuration methods
  async getPublicConfig() {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return this.getDemoConfig();
    }

    try {
      const session = await this.handleSupabaseAuth();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/public-config`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      return response.json();
    } catch (error) {
      console.error('Get public config error:', error);
      return this.getDemoConfig();
    }
  }

  async exportConfig() {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return this.getDemoExportConfig();
    }

    try {
      const session = await this.handleSupabaseAuth();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/export-config`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export configuration');
      }

      return response.json();
    } catch (error) {
      console.error('Export config error:', error);
      return this.getDemoExportConfig();
    }
  }

  async importConfig(config: any) {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return { success: true, message: 'Configuration imported (demo mode)' };
    }

    try {
      const session = await this.handleSupabaseAuth();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/import-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to import configuration');
      }

      return response.json();
    } catch (error) {
      console.error('Import config error:', error);
      throw error;
    }
  }

  async generateInstruction(data: { elementLabel: string; htmlContext: string; languageCode: string; providerId: string }) {
    if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
      return {
        instruction: `Demo instruction: Click on the "${data.elementLabel}" to proceed. This is a simulated response in demo mode.`,
        language: data.languageCode,
        provider: 'Demo Provider'
      };
    }

    try {
      const session = await this.handleSupabaseAuth();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-instruction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate instruction');
      }

      return response.json();
    } catch (error) {
      console.error('Generate instruction error:', error);
      return {
        instruction: `Fallback instruction: Click on the "${data.elementLabel}" to proceed.`,
        language: data.languageCode,
        provider: 'Fallback'
      };
    }
  }

  // Demo/fallback methods
  private handleDemoLogin(email: string, password: string) {
    const inputEmail = email?.trim().toLowerCase();
    const expectedEmail = DEMO_CREDENTIALS.email.trim().toLowerCase();
    
    if (inputEmail === expectedEmail && password === DEMO_CREDENTIALS.password) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('demo_user', JSON.stringify(DEMO_USER));
      }
      return { user: DEMO_USER, authenticated: true };
    } else {
      throw new Error(`Invalid credentials. Please use ${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password}`);
    }
  }

  private handleDemoRegister(name: string, email: string, password: string) {
    const newUser = {
      id: '1',
      name,
      email,
      created_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user', JSON.stringify(newUser));
    }
    return { user: newUser, authenticated: true };
  }

  private getDemoLanguages() {
    return { 
      languages: [
        {
          id: '1',
          code: 'en',
          label: 'English',
          tts_voice_tag: 'en-US-female',
          is_default: true,
          user_id: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          code: 'es',
          label: 'Spanish',
          tts_voice_tag: 'es-ES-female',
          is_default: false,
          user_id: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]
    };
  }

  private getDemoAIProviders() {
    return { 
      providers: [
        {
          id: '1',
          name: 'OpenAI',
          api_url: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-4',
          logo_url: '',
          languages_supported: ['en', 'es', 'fr', 'de'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Anthropic',
          api_url: 'https://api.anthropic.com/v1/messages',
          model: 'claude-3-sonnet',
          logo_url: '',
          languages_supported: ['en', 'es', 'fr'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]
    };
  }

  private getDemoConfig() {
    return {
      defaultLanguage: { code: 'en', label: 'English' },
      activeProvider: { id: '1', name: 'OpenAI', model: 'gpt-4' },
    };
  }

  private getDemoExportConfig() {
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      languages: this.getDemoLanguages().languages,
      ai_providers: this.getDemoAIProviders().providers,
      settings: {
        default_language_id: '1',
        active_provider_id: '1',
        settings_json: {}
      }
    };
  }

  // Generic request method for backward compatibility
  async get(endpoint: string) {
    switch (endpoint) {
      case '/user':
        return this.getCurrentUser();
      case '/languages':
        return this.getLanguages();
      case '/ai-providers':
        return this.getAIProviders();
      case '/public-config':
        return this.getPublicConfig();
      case '/export-config':
        return this.exportConfig();
      default:
        throw new Error(`Endpoint ${endpoint} not implemented`);
    }
  }

  async post(endpoint: string, data?: any) {
    switch (endpoint) {
      case '/login':
        return this.login(data.email, data.password);
      case '/register':
        return this.register(data.name, data.email, data.password);
      case '/logout':
        return this.logout();
      case '/languages':
        return this.createLanguage(data);
      case '/ai-providers':
        return this.createAIProvider(data);
      case '/generate-instruction':
        return this.generateInstruction(data);
      case '/import-config':
        return this.importConfig(data);
      default:
        throw new Error(`Endpoint ${endpoint} not implemented`);
    }
  }

  async put(endpoint: string, data?: any) {
    if (endpoint.startsWith('/languages/')) {
      const id = endpoint.split('/')[2];
      return this.updateLanguage(id, data);
    } else if (endpoint.startsWith('/ai-providers/')) {
      const id = endpoint.split('/')[2];
      return this.updateAIProvider(id, data);
    } else if (endpoint === '/user/profile') {
      // Handle user profile updates
      if (typeof window === 'undefined' || !this.isSupabaseReady || !supabase) {
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('demo_user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            const updatedUser = { ...user, ...data };
            localStorage.setItem('demo_user', JSON.stringify(updatedUser));
            return { success: true, user: updatedUser };
          }
        }
        return { success: false };
      }
      
      try {
        const { error } = await supabase.auth.updateUser({
          data: data
        });
        
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    }
    
    throw new Error(`Endpoint ${endpoint} not implemented`);
  }

  async delete(endpoint: string) {
    if (endpoint.startsWith('/languages/')) {
      const id = endpoint.split('/')[2];
      return this.deleteLanguage(id);
    } else if (endpoint.startsWith('/ai-providers/')) {
      const id = endpoint.split('/')[2];
      return this.deleteAIProvider(id);
    }
    
    throw new Error(`Endpoint ${endpoint} not implemented`);
  }

  // Method to check if Supabase is configured
  isOnline(): boolean {
    return this.isSupabaseReady;
  }

  // Method to get demo credentials (for UI display)
  getDemoCredentials() {
    return DEMO_CREDENTIALS;
  }
}

export const apiClient = new ApiClient();