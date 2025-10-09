import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, payload } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Example: Award crystals for completing an assessment
    if (type === 'complete_assessment' && payload.userId && payload.assessmentId) {
      const { data: settings } = await supabase
        .from('gamification_settings')
        .select('crystal_reward_assessment')
        .single();
      
      const reward = settings?.crystal_reward_assessment || 25;

      await supabase.rpc('award_crystals', {
        p_user_id: payload.userId,
        p_amount: reward,
        p_source: 'assessment_completion',
        p_description: `Completed assessment ${payload.assessmentId}`,
        p_related_entity_id: payload.assessmentId,
        p_related_entity_type: 'assessment'
      });

      return new Response(JSON.stringify({ success: true, reward }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, message: "Invalid event type" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});