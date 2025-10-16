import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Debug function called');
    
    // Test API key retrieval
    console.log('Testing API key retrieval...');
    const { data: zaiApiKey, error: keyError } = await supabase.rpc('get_provider_api_key_by_type', { p_provider_type: 'zai' });
    
    if (keyError) {
      console.error('API key error:', keyError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `API key retrieval failed: ${keyError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (!zaiApiKey) {
      console.error('No API key found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Z.AI API key not configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('API key retrieved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'API key retrieval working',
        hasApiKey: !!zaiApiKey
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Debug function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
