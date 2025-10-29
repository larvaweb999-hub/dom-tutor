import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all user's languages
    const { data: languages, error: languagesError } = await supabaseClient
      .from('languages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')

    if (languagesError) {
      throw new Error('Failed to fetch languages')
    }

    // Get all user's AI providers (excluding encrypted API keys for security)
    const { data: aiProviders, error: providersError } = await supabaseClient
      .from('ai_providers')
      .select('id, name, api_url, model, logo_url, languages_supported, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at')

    if (providersError) {
      throw new Error('Failed to fetch AI providers')
    }

    // Get user settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw new Error('Failed to fetch user settings')
    }

    // Build configuration object
    const config = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: user.id,
      languages: languages || [],
      ai_providers: aiProviders || [],
      settings: settings || {
        default_language_id: null,
        active_provider_id: null,
        settings_json: {}
      }
    }

    return new Response(
      JSON.stringify(config, null, 2),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="ai-dom-tutor-config.json"'
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})