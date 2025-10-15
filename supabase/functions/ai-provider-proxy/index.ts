// AI Provider Proxy Edge Function
// Handles API requests to AI providers to bypass CORS restrictions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface ProviderRequest {
  provider: string;
  providerType?: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client (service role for server-side DB access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Accept either uppercase or lowercase admin roles
    const role = (profile as { role?: string } | null | undefined)?.role
    if (!role || (role !== 'ADMIN' && role.toLowerCase() !== 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData: ProviderRequest = await req.json()
    const { provider, providerType: providerTypeInput, endpoint, method, headers, body } = requestData

    // Validate request
    if (!provider || !endpoint || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get provider configuration
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('*')
      // Try to match by id or name or type for flexibility
      .or(`id.eq.${provider},name.eq.${provider},type.eq.${provider}`)
      .maybeSingle()

    if (providerError || !providerData) {
      return new Response(
        JSON.stringify({ error: 'Provider not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get API key for provider
    // Try to fetch API key with optional 'encrypted' column, fallback if column doesn't exist
    let apiKeyData: { api_key: string; encrypted?: boolean } | null = null
    {
      const { data, error } = await supabase
        .from('provider_api_keys')
        .select('api_key, encrypted')
        .eq('provider_id', providerData.id)
        .maybeSingle()
      if (!error && data) {
        apiKeyData = data as { api_key: string; encrypted?: boolean }
      } else {
        // Fallback: try selecting only api_key (schemas without 'encrypted')
        const { data: data2, error: error2 } = await supabase
          .from('provider_api_keys')
          .select('api_key')
          .eq('provider_id', providerData.id)
          .maybeSingle()
        if (!error2 && data2) {
          apiKeyData = data2 as { api_key: string }
        }
      }
    }

    if (!apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'API key not found for provider' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Decrypt API key if needed
    let apiKey = apiKeyData.api_key
    if (apiKeyData.encrypted) {
      // Simple decryption (in production, use proper encryption)
      apiKey = atob(apiKey).split('_encrypted_')[0]
    }

    // Prepare headers for the provider request
    const providerHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    }

    // Add provider-specific authentication
    const providerType = (providerTypeInput || providerData.type || '').toLowerCase()
    switch (providerType) {
      case 'openai':
        providerHeaders['Authorization'] = `Bearer ${apiKey}`
        break
      case 'anthropic':
        providerHeaders['x-api-key'] = apiKey
        providerHeaders['anthropic-version'] = '2023-06-01'
        break
      case 'elevenlabs':
        providerHeaders['xi-api-key'] = apiKey
        break
      case 'zai':
      case 'z.ai':
        // Z.AI uses Authorization header with the token directly
        providerHeaders['Authorization'] = apiKey
        break
      case 'llm':
      case 'gemini':
        // Gemini uses x-goog-api-key header
        providerHeaders['x-goog-api-key'] = apiKey
        break
      default:
        providerHeaders['Authorization'] = `Bearer ${apiKey}`
    }

    // Make request to provider
    // If endpoint is absolute, use it directly. Otherwise, join with api_base if available
    const isAbsolute = /^(http|https):\/\//i.test(endpoint)
    let providerUrl = endpoint
    if (!isAbsolute && providerData.api_base) {
      const base = providerData.api_base.replace(/\/+$/, '')
      const path = endpoint.replace(/^\/+/, '')
      providerUrl = `${base}/${path}`
    }

    const providerResponse = await fetch(providerUrl, {
      method,
      headers: providerHeaders,
      body: body || undefined
    })

    // Get response data
    const responseText = await providerResponse.text()
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    // Return response
    return new Response(
      JSON.stringify({
        success: providerResponse.ok,
        data: responseData,
        statusCode: providerResponse.status,
        headers: Object.fromEntries(providerResponse.headers.entries())
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('AI Provider Proxy Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
