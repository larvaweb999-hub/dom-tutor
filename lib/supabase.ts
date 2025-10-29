import { createClient } from '@supabase/supabase-js';

// Check if we're in browser environment and have Supabase config
const supabaseUrl = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : '';
const supabaseAnonKey = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : '';

// Only create Supabase client if we have the required environment variables and we're in browser
export const supabase = (typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
    })
  : null;

// Types for our database tables
export interface Language {
  id: string;
  code: string;
  label: string;
  tts_voice_tag: string;
  is_default: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AIProvider {
  id: string;
  name: string;
  api_url: string;
  model: string;
  logo_url?: string;
  languages_supported: string[];
  api_key_encrypted: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_language_id?: string;
  active_provider_id?: string;
  settings_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Helper function to get current user
export const getCurrentUser = async () => {
  if (!supabase || typeof window === 'undefined') return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser();
  return !!user;
};

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  if (typeof window === 'undefined') return false;
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && supabase);
};