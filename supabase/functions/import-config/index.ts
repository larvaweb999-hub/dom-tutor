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

    const config = await req.json()

    // Validate config structure
    if (!config.languages || !config.ai_providers) {
      return new Response(
        JSON.stringify({ error: 'Invalid configuration format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Import languages
    for (const lang of config.languages) {
      const { error } = await supabaseClient
        .from('languages')
        .upsert({
          code: lang.code,
          label: lang.label,
          tts_voice_tag: lang.tts_voice_tag,
          is_default: lang.is_default,
          user_id: user.id
        }, {
          onConflict: 'user_id,code'
        })

      if (error) {
        console.error('Error importing language:', error)
      }
    }

    // Import AI providers (note: API keys will need to be re-entered for security)
    for (const provider of config.ai_providers) {
      const { error } = await supabaseClient
        .from('ai_providers')
        .upsert({
          name: provider.name,
          api_url: provider.api_url,
          model: provider.model,
          logo_url: provider.logo_url,
          languages_supported: provider.languages_supported,
          api_key_encrypted: 'NEEDS_RECONFIGURATION', // Security: require re-entry
          user_id: user.id
        })

      if (error) {
        console.error('Error importing AI provider:', error)
      }
    }

    // Import/update user settings
    if (config.settings) {
      const { error } = await supabaseClient
        .from('user_settings')
        .upsert({
          user_id: user.id,
          default_language_id: config.settings.default_language_id,
          active_provider_id: config.settings.active_provider_id,
          settings_json: config.settings.settings_json || {}
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error importing settings:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Configuration imported successfully. Please re-enter API keys for security.',
        imported: {
          languages: config.languages.length,
          ai_providers: config.ai_providers.length
        }
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