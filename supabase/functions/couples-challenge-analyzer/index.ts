import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define types for better code quality
interface ChallengeTemplate {
  title: string;
  description: string;
  questions: string[];
}

interface Message {
  id: string;
  sender: "ai" | "user" | "partner" | "system";
  content: string;
  timestamp: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function analyzeResponses(question: string, responseA: string, responseB: string, supabaseClient: SupabaseClient): Promise<string> {
  // Retrieve API key from database using the same method as ai-assessment-processor
  const { data: zaiApiKey, error: keyError } = await supabaseClient.rpc('get_provider_api_key_by_type', { p_provider_type: 'zai' });
  
  if (keyError) {
    console.error('Error retrieving Z.AI API key:', keyError);
    throw new Error(`Z.AI API key retrieval failed: ${keyError.message}`);
  }
  
  if (!zaiApiKey) {
    throw new Error('Z.AI API key not configured. Please add your Z.ai API key in the admin panel.');
  }

  const zaiBaseUrl = 'https://api.z.ai/api/coding/paas/v4';
  const zaiModel = 'GLM-4.6';

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
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError) throw challengeError;

    // Extract messages and question set
    const messages = (challenge.messages as Message[]) || [];
    const questionSet = challenge.question_set as Record<string, unknown>;
    
    if (!messages || messages.length === 0 || !questionSet) {
      throw new Error('Challenge data incomplete');
    }

    // Extract template data from question_set
    const template: ChallengeTemplate = {
      title: (questionSet.title as string) || "Couple's Challenge",
      description: (questionSet.description as string) || "",
      questions: Array.isArray(questionSet.questions) 
        ? questionSet.questions as string[] 
        : (questionSet.questions ? JSON.parse(questionSet.questions as string) : [])
    };

    const questions = template.questions;
    
    // Extract responses from messages
    const userMessages = messages.filter(m => m.sender === "user");
    const partnerMessages = messages.filter(m => m.sender === "partner");

    if (userMessages.length !== questions.length || partnerMessages.length !== questions.length) {
      throw new Error('Not all questions have been answered by both partners');
    }

    const analyses = [];

    // Analyze each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userResponse = userMessages[i]?.content;
      const partnerResponse = partnerMessages[i]?.content;
      
      if (userResponse && partnerResponse) {
        console.log(`Analyzing question ${i + 1} with Z.AI...`);
        const analysis = await analyzeResponses(
          question,
          userResponse,
          partnerResponse,
          supabase
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
      strengths: analyses.flatMap(a => a.strengths_as_couple).slice(0, 5),
      growth_opportunities: analyses.flatMap(a => a.growth_opportunities).slice(0, 5),
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
        challenge.partner_id ? fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gamification-engine`, {
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
        }) : Promise.resolve()
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

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error analyzing challenge:', err);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
