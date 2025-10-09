import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

const DEFAULT_INSTRUCTIONS = "You are NewMe, an empathetic AI companion for personal growth. Help the user feel seen, heard, and encouraged while guiding them with warmth and curiosity.";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { systemPrompt, memoryContext } = await req.json();

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Generate ephemeral token for OpenAI Realtime API
    const realtimeApiUrl = 'https://api.openai.com/v1/realtime/sessions';
    
    const sessionConfig = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      instructions: systemPrompt || DEFAULT_INSTRUCTIONS,
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      tools: [],
      temperature: 0.8,
      max_response_output_tokens: 4096
    };

    // Add memory context if provided
    if (memoryContext) {
      sessionConfig.instructions += `\n\nUser Context: ${memoryContext}`;
    }

    const response = await fetch(realtimeApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime API error:', errorText);
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
    }

    const sessionData = await response.json();

    // Log session creation for monitoring
    await supabaseClient.from('newme_conversations').insert({
      user_id: user.id,
      title: 'Voice Session',
      session_type: 'realtime_voice',
      metadata: { session_id: sessionData.id }
    });

    return new Response(
      JSON.stringify({
        token: sessionData.client_secret.value,
        apiUrl: `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        sessionId: sessionData.id,
        expiresAt: sessionData.client_secret.expires_at
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in realtime-token function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});