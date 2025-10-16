import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AssessmentHelperPayload {
  assessmentId: string;
  userId: string;
  action: 'analyze_questions' | 'generate_answers' | 'health_check';
  questionId?: string;
  questionText?: string;
  questionType?: string;
}

const ZAI_BASE_URL = 'https://api.z.ai/api/coding/paas/v4';
const ZAI_MODEL_SUGGESTIONS = 'GLM-4.5-Air'; // For generating answer suggestions
const ZAI_AUTH_TOKEN = 'b8979b7827034e8ab50df3d09f975ca7.fQUeGKyLX1xtGJgN';

// Z.AI API Integration for Assessment Helper
async function callZAI(prompt: string, systemPrompt: string, supabase: ReturnType<typeof createClient>) {
  let zaiApiKey = ZAI_AUTH_TOKEN;

  if (!zaiApiKey) {
    // Retrieve API key directly from provider_api_keys table as fallback
    const { data: apiKeyData, error: keyError } = await supabase
      .from('provider_api_keys')
      .select('api_key, encrypted')
      .eq('provider_id', '9415e5a1-4fcf-4aaa-98f8-44a5e9be1df8') // Z.ai provider ID
      .single();
    
    if (keyError) {
      console.error('Error retrieving Z.AI API key:', keyError);
      throw new Error(`Z.AI API key retrieval failed: ${keyError.message}`);
    }
    
    if (!apiKeyData) {
      throw new Error('Z.AI API key not configured. Please add your Z.ai API key in the admin panel.');
    }

    zaiApiKey = apiKeyData.api_key;
    if (apiKeyData.encrypted) {
      try {
        const decoded = atob(apiKeyData.api_key);
        zaiApiKey = decoded.split('_encrypted_')[0];
        console.log('API key decrypted successfully');
      } catch (decryptError) {
        console.error('Failed to decrypt API key:', decryptError);
        throw new Error('API key decryption failed');
      }
    }
  }

  console.log('Making request to Z.ai API for assessment helper');

  const response = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US,en',
      'Authorization': zaiApiKey
    },
    body: JSON.stringify({
      model: ZAI_MODEL_SUGGESTIONS,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 800,
      top_p: 0.9,
      stream: false,
      response_format: { type: 'json_object' }
    })
  });

  console.log('Z.ai API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Z.ai API error response:', errorText);
    throw new Error(`Z.AI API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return {
    content: result.choices[0].message.content,
    usage: result.usage
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: AssessmentHelperPayload = await req.json();
    const { assessmentId, userId, action, questionId, questionText, questionType } = payload;

    console.log('Assessment helper request:', { assessmentId, userId, action });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'health_check') {
      // Check if AI services are available
      try {
        const testPrompt = "Test AI health check";
        const testSystemPrompt = "Respond with: {\"status\": \"healthy\"}";
        
        await callZAI(testPrompt, testSystemPrompt, supabase);
        
        return new Response(
          JSON.stringify({
            success: true,
            status: 'healthy',
            message: 'AI services are operational'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            status: 'unhealthy',
            error: error.message,
            message: 'AI services are not available'
          }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (action === 'analyze_questions') {
      // Get assessment questions
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments_enhanced')
        .select('id, title, description, questions, category, difficulty_level')
        .eq('id', assessmentId)
        .single();

      if (assessmentError || !assessment) {
        throw new Error('Assessment not found');
      }

      const systemPrompt = `You are an expert assessment helper. Analyze the assessment questions and provide insights to help users understand what they're being asked.

Your response must be a valid JSON object with this structure:
{
  "assessment_overview": "<brief overview of what this assessment measures>",
  "question_insights": [
    {
      "question_id": "<question_id>",
      "question_text": "<question_text>",
      "purpose": "<what this question is trying to understand>",
      "tips": "<helpful tips for answering this question>",
      "suggested_approach": "<how to approach answering this question>"
    }
  ],
  "overall_guidance": "<general guidance for taking this assessment>",
  "time_estimate": "<estimated time to complete>"
}`;

      const userPrompt = `Analyze this assessment and provide helpful insights:

Assessment: ${assessment.title}
Description: ${assessment.description}
Category: ${assessment.category}
Difficulty: ${assessment.difficulty_level}

Questions:
${JSON.stringify(assessment.questions, null, 2)}

Provide insights to help users understand and answer these questions effectively.`;

      const aiResult = await callZAI(userPrompt, systemPrompt, supabase);
      let analysis;
      try {
        analysis = JSON.parse(aiResult.content);
      } catch (parseError) {
        console.error('Failed to parse Z.ai analysis:', parseError, aiResult.content);
        throw new Error('Invalid analysis format returned by Z.ai');
      }

      return new Response(
        JSON.stringify({
          success: true,
          analysis: analysis,
          assessment: {
            title: assessment.title,
            description: assessment.description,
            category: assessment.category,
            difficulty: assessment.difficulty_level
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'generate_answers') {
      if (!questionText || !questionType) {
        throw new Error('Question text and type are required for answer generation');
      }

      const systemPrompt = `You are an expert assessment helper. Generate 2-3 concise answer options to help users understand expected responses.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "question_analysis": "<brief analysis in 1 sentence>",
  "answer_options": [
    {"option_text": "<answer>", "explanation": "<why good>", "tone": "<tone>"},
    {"option_text": "<answer>", "explanation": "<why good>", "tone": "<tone>"}
  ],
  "guidance": "<1-2 sentence guidance>",
  "common_pitfalls": "<what to avoid>"
}`;

      const userPrompt = `Question (${questionType}): ${questionText}

Generate 2-3 example answers that demonstrate good responses to this question.`;

      const aiResult = await callZAI(userPrompt, systemPrompt, supabase);
      let answerOptions;
      try {
        answerOptions = JSON.parse(aiResult.content);
      } catch (parseError) {
        console.error('Failed to parse Z.ai answer options:', parseError, aiResult.content);
        throw new Error('Invalid answer options format returned by Z.ai');
      }

      return new Response(
        JSON.stringify({
          success: true,
          questionId: questionId,
          answerOptions: answerOptions
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    console.error('Error in assessment helper:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Assessment helper service is temporarily unavailable'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
