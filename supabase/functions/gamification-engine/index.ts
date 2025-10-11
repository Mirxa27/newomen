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

    // Get gamification settings
    const { data: settings } = await supabase
      .from('gamification_settings')
      .select('*')
      .single();

    let reward = 0;
    let source = '';
    let description = '';
    let relatedEntityId = null;
    let relatedEntityType = null;

    // Handle different event types
    switch (type) {
      case 'complete_assessment':
        if (!payload.userId || !payload.assessmentId) {
          throw new Error('Missing userId or assessmentId');
        }
        reward = settings?.crystal_reward_assessment || 25;
        source = 'assessment_completion';
        description = `Completed assessment ${payload.assessmentId}`;
        relatedEntityId = payload.assessmentId;
        relatedEntityType = 'assessment';
        break;

      case 'daily_login':
        if (!payload.userId) {
          throw new Error('Missing userId');
        }
        reward = settings?.crystal_reward_daily_login || 5;
        source = 'daily_login';
        description = 'Daily login bonus';
        break;

      case 'complete_conversation':
        if (!payload.userId || !payload.conversationId) {
          throw new Error('Missing userId or conversationId');
        }
        reward = settings?.crystal_reward_conversation || 10;
        source = 'conversation_completion';
        description = `Completed conversation ${payload.conversationId}`;
        relatedEntityId = payload.conversationId;
        relatedEntityType = 'conversation';
        break;

      case 'complete_narrative_exploration':
        if (!payload.userId || !payload.explorationId) {
          throw new Error('Missing userId or explorationId');
        }
        reward = 15;
        source = 'narrative_exploration';
        description = `Completed narrative exploration ${payload.explorationId}`;
        relatedEntityId = payload.explorationId;
        relatedEntityType = 'narrative_exploration';
        break;

      case 'complete_couples_challenge':
        if (!payload.userId || !payload.challengeId) {
          throw new Error('Missing userId or challengeId');
        }
        reward = 20;
        source = 'couples_challenge';
        description = `Completed couples challenge ${payload.challengeId}`;
        relatedEntityId = payload.challengeId;
        relatedEntityType = 'couples_challenge';
        break;

      case 'complete_wellness_resource':
        if (!payload.userId || !payload.resourceId) {
          throw new Error('Missing userId or resourceId');
        }
        reward = 5;
        source = 'wellness_resource';
        description = `Completed wellness resource ${payload.resourceId}`;
        relatedEntityId = payload.resourceId;
        relatedEntityType = 'wellness_resource';
        break;

      case 'make_connection':
        if (!payload.userId || !payload.connectionId) {
          throw new Error('Missing userId or connectionId');
        }
        reward = 10;
        source = 'make_connection';
        description = `Made a new connection ${payload.connectionId}`;
        relatedEntityId = payload.connectionId;
        relatedEntityType = 'connection';
        break;

      default:
        return new Response(JSON.stringify({ success: false, message: `Unknown event type: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Award crystals
    const { error: rpcError } = await supabase.rpc('award_crystals', {
      p_user_id: payload.userId,
      p_amount: reward,
      p_source: source,
      p_description: description,
      p_related_entity_id: relatedEntityId,
      p_related_entity_type: relatedEntityType
    });

    if (rpcError) {
      console.error('Error awarding crystals:', rpcError);
      // Don't fail the request if crystals can't be awarded
    }

    return new Response(JSON.stringify({ success: true, reward, type }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});