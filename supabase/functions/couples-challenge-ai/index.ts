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
  | { type: 'generateRealTimeInsight'; payload: { recentMessages: Array<{ sender: string; content: string; timestamp: string }>; challengeProgress: number } }
  | { type: 'synthesizeChallengeAnalysis'; payload: { allResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>; partnerQualities?: { user: PartnerQualityData; partner: PartnerQualityData } } };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function callZAI(systemPrompt: string, userPrompt: string, supabaseClient: ReturnType<typeof createClient>, useFastModel: boolean = false): Promise<string> {
  // Use provided API key directly for better performance
  const zaiApiKey = 'b8979b7827034e8ab50df3d09f975ca7.fQUeGKyLX1xtGJgN';
  
  const zaiBaseUrl = 'https://api.z.ai/api/coding/paas/v4';
  const zaiModel = useFastModel ? 'GLM-4.5-Air' : 'GLM-4.6'; // GLM-4.5-Air for fast operations, GLM-4.6 for results

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

  const result = await callZAI(systemPrompt, userPrompt, supabaseClient, false); // Use GLM-4.6 for result generation
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

  const result = await callZAI(systemPrompt, userPrompt, supabaseClient, false); // Use GLM-4.6 for result generation
  return JSON.parse(result);
}

async function generateQualityApprovalQuestion(
  userPerspective: PsychologicalPerspective,
  partnerPerspective: PsychologicalPerspective,
  originalQualities: PartnerQualityData,
  supabaseClient: ReturnType<typeof createClient>
): Promise<QualityApprovalResult> {
  const systemPrompt = `You are a relationship counselor. Create a question that asks one partner to approve or disapprove of the psychological analysis of their desired qualities, fostering deeper understanding.

Your response must be a valid JSON object with this structure:
{
  "question": "The question asking for approval/disapproval of the psychological analysis",
  "context": "Explanation of why this question matters for their relationship",
  "approvalOptions": ["I agree with this analysis", "This is partially accurate", "I disagree with this analysis", "I need to think more about this"],
  "psychologicalRationale": "Why getting their approval/disapproval is important for relationship growth"
}`;

  const userPrompt = `Based on these psychological perspectives, create an approval question:

User's Psychological Perspective:
${JSON.stringify(userPerspective, null, 2)}

Partner's Psychological Perspective:
${JSON.stringify(partnerPerspective, null, 2)}

Original Desired Qualities:
${JSON.stringify(originalQualities, null, 2)}

Create a question that:
1. Presents the psychological analysis to the partner
2. Asks for their approval or disapproval
3. Provides meaningful response options
4. Explains why their perspective matters
5. Encourages open dialogue about the analysis`;

  const result = await callZAI(systemPrompt, userPrompt, supabaseClient, true); // Use GLM-4.5-Air for fast approval questions
  return JSON.parse(result);
}

async function generateRealTimeInsight(
  recentMessages: Array<{ sender: string; content: string; timestamp: string }>,
  challengeProgress: number,
  supabaseClient: ReturnType<typeof createClient>
): Promise<RealTimeInsightResult> {
  const systemPrompt = `You are a relationship coach providing real-time insights during couples challenges. Analyze the conversation and provide meaningful, actionable insights.

Your response must be a valid JSON object with this structure:
{
  "insight": "A meaningful insight about their communication or relationship dynamics",
  "context": "Why this insight is relevant right now",
  "conversationStarters": ["starter1", "starter2"],
  "emotionalTone": "The overall emotional tone of their conversation",
  "relationshipDynamics": ["dynamic1", "dynamic2"]
}`;

  const userPrompt = `Analyze this recent conversation from a couples challenge:

Recent Messages:
${JSON.stringify(recentMessages, null, 2)}

Challenge Progress: ${challengeProgress}%

Provide:
1. A meaningful insight about their interaction
2. Why this insight matters at this point
3. Conversation starters to deepen their understanding
4. The emotional tone of their conversation
5. Key relationship dynamics observed

Keep it supportive, constructive, and focused on growth.`;

  const result = await callZAI(systemPrompt, userPrompt, supabaseClient, true); // Use GLM-4.5-Air for fast real-time insights
  return JSON.parse(result);
}

async function synthesizeChallengeAnalysis(
  allResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
  partnerQualities: { user: PartnerQualityData; partner: PartnerQualityData } | undefined,
  supabaseClient: ReturnType<typeof createClient>
): Promise<CouplesAnalysisResult> {
  const systemPrompt = `You are an expert relationship counselor. Synthesize all responses from a couples challenge into a comprehensive analysis.

Your response must be a valid JSON object with this structure:
{
  "compatibilityScore": 85,
  "strengths": ["strength1", "strength2", "strength3"],
  "growthOpportunities": ["opportunity1", "opportunity2"],
  "communicationPatterns": ["pattern1", "pattern2"],
  "psychologicalInsights": {
    "attachmentStyle": "Combined attachment style analysis",
    "loveLanguage": "Primary love languages and compatibility",
    "conflictResolution": "How they handle conflicts together",
    "emotionalNeeds": ["shared need1", "shared need2"],
    "growthAreas": ["area for growth1", "area for growth2"]
  },
  "nextSteps": ["suggestion1", "suggestion2", "suggestion3"],
  "conversationStarters": ["starter1", "starter2", "starter3"]
}`;

  const userPrompt = `Synthesize this complete couples challenge:

All Challenge Responses:
${JSON.stringify(allResponses, null, 2)}

${partnerQualities ? `
Partner Quality Analysis:
User Qualities: ${JSON.stringify(partnerQualities.user, null, 2)}
Partner Qualities: ${JSON.stringify(partnerQualities.partner, null, 2)}
` : ''}

Create a comprehensive analysis that includes:
1. Overall compatibility score (0-100)
2. Relationship strengths
3. Growth opportunities
4. Communication patterns observed
5. Psychological insights about their dynamic
6. Specific next steps for their relationship
7. Conversation starters for future discussions

Make it supportive, actionable, and focused on growth.`;

  const result = await callZAI(systemPrompt, userPrompt, supabaseClient, false); // Use GLM-4.6 for comprehensive analysis
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
        
      case 'generateQualityApprovalQuestion':
        result = await generateQualityApprovalQuestion(
          operation.payload.userPerspective,
          operation.payload.partnerPerspective,
          operation.payload.originalQualities,
          supabase
        );
        break;
        
      case 'generateRealTimeInsight':
        result = await generateRealTimeInsight(
          operation.payload.recentMessages,
          operation.payload.challengeProgress,
          supabase
        );
        break;
        
      case 'synthesizeChallengeAnalysis':
        result = await synthesizeChallengeAnalysis(
          operation.payload.allResponses,
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
