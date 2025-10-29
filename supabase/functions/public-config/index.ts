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

    // Get user settings with related data
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select(`
        *,
        default_language:languages!user_settings_default_language_id_fkey(code, label),
        active_provider:ai_providers!user_settings_active_provider_id_fkey(id, name, model)
      `)
      .eq('user_id', user.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw new Error('Failed to fetch user settings')
    }

    // If no settings exist, try to get defaults
    let defaultLanguage = null
    let activeProvider = null

    if (settings) {
      defaultLanguage = settings.default_language
      activeProvider = settings.active_provider
    } else {
      // Get first language as default
      const { data: firstLang } = await supabaseClient
        .from('languages')
        .select('code, label')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (firstLang) {
        defaultLanguage = firstLang
      }

      // Get first provider as active
      const { data: firstProvider } = await supabaseClient
        .from('ai_providers')
        .select('id, name, model')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (firstProvider) {
        activeProvider = firstProvider
      }
    }

    return new Response(
      JSON.stringify({
        defaultLanguage,
        activeProvider,
        settings: settings?.settings_json || {}
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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