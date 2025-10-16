import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

// Use production PayPal API for live transactions
const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'live';
const PAYPAL_API_BASE = PAYPAL_MODE === 'sandbox' 
  ? 'https://api.sandbox.paypal.com'
  : 'https://api.paypal.com';

async function getAccessToken() {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderID, tier, userId } = await req.json();
    const accessToken = await getAccessToken();

    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const captureData = await captureResponse.json();

    if (captureData.status === 'COMPLETED') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      );

      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          provider: 'paypal',
          provider_id: orderID,
          status: 'active',
          renewal_date: renewalDate.toISOString(),
        })
        .select()
        .single();

      if (subscriptionError) {
        throw subscriptionError;
      }

      let remainingMinutes;
      if (tier === 'Growth') {
        remainingMinutes = 100;
      } else if (tier === 'Transformation') {
        remainingMinutes = 1000;
      }

      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          remaining_minutes: remainingMinutes,
        })
        .eq('id', userId);

      if (userError) {
        throw userError;
      }

      return new Response(JSON.stringify({ success: true, subscription }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error('Payment not completed');
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});