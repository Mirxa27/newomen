import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

interface AssessmentHelperPayload {
  assessmentId: string;
  userId: string;
  action: 'analyze_questions' | 'generate_answers' | 'health_check';
  questionId?: string;
  questionText?: string;
  questionType?: string;
}

interface AssessmentAnalysisRequest {
  assessment_id: string;
  user_id: string;
  responses: Record<string, string | number | boolean>;
  zai_config?: {
    questions_model?: string;  // GLM-4.5-Air (default)
    results_model?: string;     // GLM-4.6 (default)
  };
}

// Z.AI Configuration
const ZAI_CONFIG = {
  base_url: Deno.env.get('ZAI_BASE_URL') || 'https://api.z.ai/api/coding/paas/v4',
  auth_token: Deno.env.get('ZAI_AUTH_TOKEN') || 'b8979b7827034e8ab50df3d09f975ca7.fQUeGKyLX1xtGJgN',
  questions_model: 'GLM-4.5-Air',   // For question generation
  results_model: 'GLM-4.6',          // For result generation
};

// NOTE: Removed duplicate callZAI(model, prompt) implementation to prevent boot-time errors.

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Database = {
  public: {
    Tables: {
      provider_api_keys: {
        Row: {
          id: string;
          provider_id: string;
          api_key: string;
          encrypted: boolean | null;
        };
        Insert: {
          id?: string;
          provider_id: string;
          api_key: string;
          encrypted?: boolean | null;
        };
        Update: {
          id?: string;
          provider_id?: string;
          api_key?: string;
          encrypted?: boolean | null;
        };
        Relationships: [];
      };
      assessments_enhanced: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          questions: Json | null;
          category: string | null;
          difficulty_level: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          questions?: Json | null;
          category?: string | null;
          difficulty_level?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          questions?: Json | null;
          category?: string | null;
          difficulty_level?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_provider_api_key_by_type: {
        Args: { p_provider_type: string };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const ZAI_BASE_URL = 'https://api.z.ai/api/coding/paas/v4';
const ZAI_MODEL_SUGGESTIONS = 'GLM-4.5-Air'; // For generating answer suggestions

type TypedSupabaseClient = SupabaseClient<Database, 'public'>;

async function getZaiApiKey(supabase: TypedSupabaseClient): Promise<string> {
  const envKey = Deno.env.get('ZAI_API_KEY');
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }

  const { data, error } = await supabase.rpc('get_provider_api_key_by_type', { p_provider_type: 'zai' });
  if (error) {
    console.error('Error retrieving Z.AI API key:', error);
    throw new Error(`Z.AI API key retrieval failed: ${error.message}`);
  }

  if (!data || typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('Z.AI API key not configured. Please add your Z.ai API key in the admin panel.');
  }

  return data.trim();
}

// Z.AI API Integration for Assessment Helper
async function callZAI(prompt: string, systemPrompt: string, supabase: TypedSupabaseClient) {
  const zaiApiKey = await getZaiApiKey(supabase);

  console.log('Making request to Z.ai API for assessment helper');

  const response = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US,en',
      'Authorization': `Bearer ${zaiApiKey}`
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

    const supabase = createClient<Database>(
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
            error: error instanceof Error ? error.message : String(error),
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
    const message = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: message,
        message: 'Assessment helper service is temporarily unavailable'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
