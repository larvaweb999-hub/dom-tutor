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

    const { elementLabel, htmlContext, languageCode, providerId } = await req.json()

    // Get the AI provider details
    const { data: provider, error: providerError } = await supabaseClient
      .from('ai_providers')
      .select('*')
      .eq('id', providerId)
      .eq('user_id', user.id)
      .single()

    if (providerError || !provider) {
      return new Response(
        JSON.stringify({ error: 'AI provider not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the language details
    const { data: language, error: languageError } = await supabaseClient
      .from('languages')
      .select('*')
      .eq('code', languageCode)
      .eq('user_id', user.id)
      .single()

    if (languageError || !language) {
      return new Response(
        JSON.stringify({ error: 'Language not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decrypt API key (in a real implementation, you'd decrypt the stored key)
    // For now, we'll assume the key is stored as-is (you should implement proper encryption)
    const apiKey = provider.api_key_encrypted

    // Generate instruction based on provider
    let instruction = ''
    
    if (provider.name.toLowerCase().includes('openai')) {
      // Call OpenAI API
      const openaiResponse = await fetch(provider.api_url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            {
              role: 'system',
              content: `You are a helpful DOM tutor. Generate a brief, clear instruction in ${language.label} for interacting with a web element. Keep it under 50 words.`
            },
            {
              role: 'user',
              content: `Element: ${elementLabel}\nHTML Context: ${htmlContext}\nLanguage: ${language.label}`
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      })

      if (openaiResponse.ok) {
        const data = await openaiResponse.json()
        instruction = data.choices[0]?.message?.content || 'Click on this element to proceed.'
      } else {
        instruction = `Click on the "${elementLabel}" to proceed.`
      }
    } else if (provider.name.toLowerCase().includes('anthropic')) {
      // Call Anthropic API
      const anthropicResponse = await fetch(provider.api_url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: `Generate a brief, clear instruction in ${language.label} for interacting with this web element: ${elementLabel}. HTML Context: ${htmlContext}. Keep it under 50 words.`
            }
          ]
        })
      })

      if (anthropicResponse.ok) {
        const data = await anthropicResponse.json()
        instruction = data.content[0]?.text || 'Click on this element to proceed.'
      } else {
        instruction = `Click on the "${elementLabel}" to proceed.`
      }
    } else {
      // Generic fallback
      instruction = `Click on the "${elementLabel}" to proceed.`
    }

    return new Response(
      JSON.stringify({
        instruction,
        language: language.code,
        provider: provider.name,
        tts_voice_tag: language.tts_voice_tag
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