import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AIQuestionGeneration {
  question: string;
  context: string;
  psychologicalIntent: string;
  expectedInsight: string;
}

interface PartnerQualityData {
  userId: string;
  partnerName: string;
  desiredQualities: string[];
  relationshipGoals: string;
  communicationStyle: string;
  values: string[];
}

interface PsychologicalPerspective {
  attachmentStyle: string;
  loveLanguage: string;
  conflictResolution: string;
  emotionalNeeds: string[];
  growthAreas: string[];
}

interface QualityAnalysisResult {
  userPerspective: PsychologicalPerspective;
  partnerPerspective: PsychologicalPerspective;
  compatibilityAnalysis: string;
  alignmentScore: number;
}

interface QualityApprovalResult {
  question: string;
  context: string;
  approvalOptions: string[];
  psychologicalRationale: string;
}

interface RealTimeInsightResult {
  insight: string;
  context: string;
  conversationStarters: string[];
  emotionalTone: string;
  relationshipDynamics: string[];
}

interface CouplesAnalysisResult {
  compatibilityScore: number;
  strengths: string[];
  growthOpportunities: string[];
  communicationPatterns: string[];
  psychologicalInsights: PsychologicalPerspective;
  nextSteps: string[];
  conversationStarters: string[];
}

type AIOperation = 
  | { type: 'generateDynamicQuestion'; payload: { previousResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>; currentContext: string; challengeProgress: number } }
  | { type: 'analyzePartnerQualities'; payload: { userQualities: PartnerQualityData; partnerQualities: PartnerQualityData } }
  | { type: 'generateQualityApprovalQuestion'; payload: { userPerspective: PsychologicalPerspective; partnerPerspective: PsychologicalPerspective; originalQualities: PartnerQualityData } }
  | { type: 'generateRealTimeInsight'; payload: { recentMessages: Array<{ sender: string; content: string; timestamp: string }>; challengeProgress: number; currentContext: string } }
  | { type: 'generateCouplesAnalysis'; payload: { challengeId: string; userResponses: string[]; partnerResponses: string[]; questions: string[] } };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function callZAI(systemPrompt: string, userPrompt: string, supabaseClient: ReturnType<typeof createClient>): Promise<string> {
  // Retrieve API key from database
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
  return result.choices[0].message.content;
}

async function generateDynamicQuestion(
  previousResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
  currentContext: string,
  challengeProgress: number,
  supabaseClient: ReturnType<typeof createClient>
): Promise<AIQuestionGeneration> {
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

  const result = await callZAI(systemPrompt, userPrompt, supabaseClient);
  return JSON.parse(result);
}

async function analyzePartnerQualities(
  userQualities: PartnerQualityData,
  partnerQualities: PartnerQualityData,
  supabaseClient: ReturnType<typeof createClient>
): Promise<QualityAnalysisResult> {
  const systemPrompt = `You are an expert relationship psychologist. Analyze the desired partner qualities from both individuals in a relationship and provide psychological perspectives.

Your response must be a valid JSON object with this structure:
{
  "userPerspective": {
    "attachmentStyle": "Analysis of user's attachment style based on their desired qualities",
    "loveLanguage": "Primary love language based on their preferences",
    "conflictResolution": "Preferred conflict resolution style",
    "emotionalNeeds": ["need1", "need2", "need3"],
    "growthAreas": ["area1", "area2"]
  },
  "partnerPerspective": {
    "attachmentStyle": "Analysis of partner's attachment style based on their desired qualities",
    "loveLanguage": "Primary love language based on their preferences",
    "conflictResolution": "Preferred conflict resolution style",
    "emotionalNeeds": ["need1", "need2", "need3"],
    "growthAreas": ["area1", "area2"]
  },
  "compatibilityAnalysis": "Comprehensive analysis of their compatibility based on psychological perspectives",
  "alignmentScore": 85
}`;

  const userPrompt = `Analyze these partner quality responses from both individuals:

User's Desired Qualities:
${JSON.stringify(userQualities, null, 2)}

Partner's Desired Qualities:
${JSON.stringify(partnerQualities, null, 2)}

Provide psychological analysis including:
1. Attachment styles for both individuals
2. Primary love languages
3. Conflict resolution preferences
4. Core emotional needs
5. Areas for growth
6. Overall compatibility analysis with alignment score (0-100)

Focus on deep psychological insights that will help them understand each other better.`;

  const result = await callZAI(systemPrompt, userPrompt, supabaseClient);
  return JSON.parse(result);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const operation: AIOperation = await req.json();
    
    let result: unknown;

    switch (operation.type) {
      case 'generateDynamicQuestion':
        result = await generateDynamicQuestion(
          operation.payload.previousResponses,
          operation.payload.currentContext,
          operation.payload.challengeProgress,
          supabase
        );
        break;
        
      case 'analyzePartnerQualities':
        result = await analyzePartnerQualities(
          operation.payload.userQualities,
          operation.payload.partnerQualities,
          supabase
        );
        break;
        
      default:
        throw new Error(`Unsupported operation type: ${(operation as any).type}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in couples-challenge-ai:', error);
    
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
