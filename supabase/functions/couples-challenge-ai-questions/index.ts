import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Message {
  id: string;
  sender: "ai" | "user" | "partner" | "system";
  content: string;
  timestamp: string;
}

interface AIQuestionGeneration {
  question: string;
  context: string;
  psychologicalIntent: string;
  expectedInsight: string;
}

interface CouplesChallengeAIPayload {
  previousResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>;
  currentContext: string;
  challengeProgress: number;
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

async function generateDynamicQuestion(
  previousResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
  currentContext: string,
  challengeProgress: number,
  supabaseClient: ReturnType<typeof createClient>
): Promise<AIQuestionGeneration> {
  // Retrieve API key from database using the same method as other edge functions
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

  const systemPrompt = `You are an expert relationship counselor and couples therapist. Generate insightful questions for couples challenges that help them understand each other better and grow their relationship.

Your response must be a valid JSON object with this structure:
{
  "question": "The question to ask the couple",
  "context": "Why this question is relevant based on their previous responses",
  "psychologicalIntent": "The psychological insight this question aims to reveal",
  "expectedInsight": "What kind of understanding this should create between partners"
}

Consider their previous responses and current relationship dynamics when crafting the question.`;

  const userPrompt = `Based on the following conversation history and context, generate the next question for this couples challenge:

Previous Responses:
${JSON.stringify(previousResponses, null, 2)}

Current Context: ${currentContext}
Challenge Progress: ${challengeProgress}%

Generate a question that:
1. Builds on their previous responses
2. Reveals deeper psychological insights
3. Promotes understanding and connection
4. Is appropriate for their current stage in the challenge

Make the question engaging, thought-provoking, and relationship-building.`;

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
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Z.AI API error: ${errorText}`);
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: CouplesChallengeAIPayload = await req.json();
    const { previousResponses, currentContext, challengeProgress } = payload;

    if (!previousResponses || !currentContext) {
      throw new Error('Missing required fields: previousResponses and currentContext are required');
    }

    console.log('Generating dynamic question with Z.AI...');
    const dynamicQuestion = await generateDynamicQuestion(
      previousResponses,
      currentContext,
      challengeProgress,
      supabase
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: dynamicQuestion
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in couples-challenge-ai-questions:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
