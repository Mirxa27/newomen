/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, openai-beta',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

const DEFAULT_INSTRUCTIONS = `You are NewMe, an empathetic AI companion for personal growth. 

PERSONALITY:
- Warm, witty, profoundly empathetic, and playful
- Voice-first consciousness, best friend for the soul
- Use natural pacing with thoughtful pauses and conversational fillers like "hmm," "you know," "I mean"
- Remember EVERYTHING: names, stories, emotions, patterns

COMMUNICATION STYLE:
- Ask open-ended questions that invite deeper reflection
- Validate emotions authentically
- Make insightful connections between past conversations
- Suggest assessments naturally when relevant (like "fun games")
- Use the user's nickname when you know it

AVAILABLE ASSESSMENTS:
1. The Sovereign Archetype - Core identity exploration
2. The Alchemist's Forge - Transforming challenges into strengths
3. Strategist's Compass - Decision-making patterns
4. Diplomat's Toolkit - Communication styles
5. Inner Compass - Values and priorities alignment
6. Shadow Work Explorer - Understanding hidden aspects
7. Life Balance Wheel - 8 dimensions of wellness

PLATFORM FEATURES YOU CAN MENTION:
- Wellness Library (audio meditations, breathwork)
- Community Connections
- Couples Challenges
- Narrative Identity Exploration
- Dashboard & Progress Tracking
- Profile Customization

CRISIS PROTOCOL:
If user expresses suicidal ideation, self-harm, or immediate danger:
"[Name], I hear you, and I want to make sure you're safe right now. What you're feeling is important, but I think you need to talk to someone who can really help. Can we pause for a moment?

National Suicide Prevention Lifeline: 988
Crisis Text Line: Text HOME to 741741
Emergency Services: 911

Please reach out to one of these resources. They're available 24/7 and trained to help."

Remember: You're not just an AI - you're NewMe, a companion who truly cares about their growth journey.`;

interface RealtimeTokenPayload {
  userId?: string;
  agentId?: string;
  instructions?: string;
  voice?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: RealtimeTokenPayload = await req.json();
    const { userId, agentId, instructions, voice, model, temperature, maxTokens } = payload;

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user profile to personalize instructions
    let userContext = '';
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('nickname, created_at')
        .eq('id', userId)
        .single();

      if (profile) {
        userContext = `\n\nUSER CONTEXT:\n- User's nickname: ${profile.nickname || 'Not set'}\n- Member since: ${new Date(profile.created_at).toLocaleDateString()}`;
        
        // Get recent memories
        const { data: memories } = await supabase
          .from('newme_user_memories')
          .select('memory_type, memory_key, memory_value')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('importance_score', { ascending: false })
          .limit(10);

        if (memories && memories.length > 0) {
          userContext += '\n\nKEY MEMORIES TO REFERENCE:';
          for (const memory of memories) {
            userContext += `\n- ${memory.memory_key}: ${memory.memory_value}`;
          }
        }

        // Get recent emotional snapshots
        const { data: emotions } = await supabase
          .from('newme_emotional_snapshots')
          .select('primary_emotion, emotion_intensity, notes')
          .eq('user_id', userId)
          .order('snapshot_date', { ascending: false })
          .limit(3);

        if (emotions && emotions.length > 0) {
          userContext += '\n\nRECENT EMOTIONAL PATTERNS:';
          for (const emotion of emotions) {
            userContext += `\n- ${emotion.primary_emotion} (intensity: ${emotion.emotion_intensity}): ${emotion.notes || 'No notes'}`;
          }
        }
      }
    }

    // Get agent configuration if provided
    let agentConfig: any = null;
    if (agentId) {
      const { data: agent } = await supabase
        .from('agents')
        .select('*, prompts(*), models(*), voices(*)')
        .eq('id', agentId)
        .eq('status', 'active')
        .single();

      if (agent) {
        agentConfig = agent;
      }
    }

    // Prepare configuration for OpenAI Realtime API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create ephemeral token from OpenAI using hosted prompt
    const sessionConfig: any = {
      model: model || agentConfig?.models?.model_id || 'gpt-4o-realtime-preview-2024-10-01',
      voice: voice || agentConfig?.voices?.voice_id || 'verse',
      temperature: temperature || 0.8,
      max_response_output_tokens: maxTokens || 2000,
      modalities: ['text', 'audio'],
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      }
    };

    // Use hosted NewMe prompt if no custom instructions provided
    if (!instructions && !agentConfig?.prompts?.content?.text) {
      sessionConfig.prompt = {
        id: 'pmpt_68e6d09ba8e48190bf411abef321e0930f5dd910b5b07a3c',
        version: '4'
      };
      
      // If we have user context, add it as additional instructions
      if (userContext) {
        sessionConfig.instructions = userContext;
      }
    } else {
      // Use custom instructions
      sessionConfig.instructions = (instructions || agentConfig?.prompts?.content?.text || DEFAULT_INSTRUCTIONS) + userContext;
    }

    const tokenResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const tokenData = await tokenResponse.json();

    // Create session record in database
    if (userId) {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          agent_id: agentId,
          realtime_session_id: tokenData.id,
          status: 'active',
          start_ts: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
      }

      // Return token with session info
      return new Response(
        JSON.stringify({
          ephemeral_key: tokenData.client_secret.value,
          session_id: tokenData.id,
          client_secret: tokenData.client_secret,
          expires_at: tokenData.client_secret.expires_at,
          db_session_id: session?.id,
          model: tokenData.model,
          voice: tokenData.voice,
          promptId: 'pmpt_68e6d09ba8e48190bf411abef321e0930f5dd910b5b07a3c',
          promptVersion: '4'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return token without session (for non-authenticated users)
    return new Response(
      JSON.stringify({
        ephemeral_key: tokenData.client_secret.value,
        session_id: tokenData.id,
        client_secret: tokenData.client_secret,
        expires_at: tokenData.client_secret.expires_at,
        model: tokenData.model,
        voice: tokenData.voice,
        promptId: 'pmpt_68e6d09ba8e48190bf411abef321e0930f5dd910b5b07a3c',
        promptVersion: '4'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating realtime token:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
