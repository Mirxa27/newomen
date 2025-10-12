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

async function analyzeResponses(question: string, responseA: string, responseB: string): Promise<string> {
  const zaiApiKey = Deno.env.get('ZAI_API_KEY');
  const zaiBaseUrl = Deno.env.get('ZAI_BASE_URL') || 'https://api.z.ai/api/coding/paas/v4';
  const zaiModel = Deno.env.get('ZAI_MODEL') || 'glm-4.6';

  if (!zaiApiKey) {
    throw new Error('Z.AI API key not configured');
  }

  const systemPrompt = `You are an expert relationship counselor and couples therapist. Analyze the responses from two people in a relationship challenge and provide insightful, constructive feedback.

Your response must be a valid JSON object with this structure:
{
  "overall_analysis": "<brief overview of how their responses align or differ>",
  "individual_insights": {
    "person_a": "<personalized insight for person A>",
    "person_b": "<personalized insight for person B>"
  },
  "alignment_score": <number 0-100, how aligned are their values/perspectives>,
  "growth_opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "conversation_starters": ["<question or topic to discuss together>", "<another topic>"],
  "strengths_as_couple": ["<strength 1>", "<strength 2>"]
}`;

  const userPrompt = `Analyze this couple's challenge responses:

Question: ${question}

Person A's Response:
${responseA}

Person B's Response:
${responseB}

Provide comprehensive analysis with insights for both individuals and the relationship.`;

  const response = await fetch(`${zaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US,en',
      'Authorization': `Bearer ${zaiApiKey}`
    },
    body: JSON.stringify({
      model: zaiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 2000,
      stream: false,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Z.AI API error: ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { challengeId } = await req.json();

    if (!challengeId) {
      throw new Error('Challenge ID is required');
    }

    // Get challenge data
    const { data: challenge, error: challengeError } = await supabase
      .from('couples_challenges')
      .select(`
        *,
        challenge_templates (
          title,
          description,
          questions
        )
      `)
      .eq('id', challengeId)
      .single();

    if (challengeError) throw challengeError;

    // Check if both partners have responded
    const responses = challenge.responses as Record<string, any>;
    const template = challenge.challenge_templates as any;
    
    if (!responses || !template) {
      throw new Error('Challenge data incomplete');
    }

    const questions = Array.isArray(template.questions) ? template.questions : [];
    const analyses = [];

    // Analyze each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const responseData = responses[i.toString()] || {};
      
      if (responseData.initiator_response && responseData.partner_response) {
        console.log(`Analyzing question ${i + 1} with Z.AI...`);
        const analysis = await analyzeResponses(
          question,
          responseData.initiator_response,
          responseData.partner_response
        );
        analyses.push(JSON.parse(analysis));
      }
    }

    // Combine all analyses into comprehensive report
    const combinedAnalysis = {
      challenge_title: template.title,
      total_questions: questions.length,
      questions_analyzed: analyses.length,
      overall_alignment: Math.round(
        analyses.reduce((sum, a) => sum + a.alignment_score, 0) / analyses.length
      ),
      detailed_analyses: analyses,
      summary: analyses.length > 0 ? analyses[0].overall_analysis : 'Analysis pending',
      next_steps: analyses.flatMap(a => a.conversation_starters).slice(0, 3),
      provider: 'Z.AI GLM-4.6'
    };

    // Save analysis result
    const { error: updateError } = await supabase
      .from('couples_challenges')
      .update({
        ai_analysis: combinedAnalysis,
        status: 'analyzed',
        updated_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (updateError) throw updateError;

    // Award crystals to both partners
    try {
      await Promise.all([
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gamification-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            type: 'complete_couples_challenge',
            payload: {
              userId: challenge.initiator_id,
              challengeId: challengeId
            }
          })
        }),
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gamification-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            type: 'complete_couples_challenge',
            payload: {
              userId: challenge.partner_id,
              challengeId: challengeId
            }
          })
        })
      ]);
    } catch (gamError) {
      console.error('Gamification error (non-critical):', gamError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: combinedAnalysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error analyzing challenge:', error);

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
