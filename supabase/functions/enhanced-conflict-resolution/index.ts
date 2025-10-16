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

interface ConflictAnalysisRequest {
  type: 'analyzeConflictPattern' | 'generateConflictResolutionSuggestion' | 'provideRealTimeConflictInsight' | 'assessConflictResolutionProgress' | 'generatePersonalizedConflictAdvice';
  payload: Record<string, unknown>;
}

interface ConflictMessage {
  sender: string;
  content: string;
  timestamp?: string;
}

interface ConflictAnalysis {
  patternType: string;
  severity: number;
  triggerPhrases: string[];
  emotionalImpact: string;
}

interface UserProfile {
  communicationStyle: string;
  emotionalTendencies: string[];
  conflictHistory: string[];
}

interface ExerciseRecord {
  exerciseType: string;
  effectiveness: number;
}

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
    const { type, payload }: ConflictAnalysisRequest = await req.json();

    switch (type) {
      case 'analyzeConflictPattern':
        return await analyzeConflictPattern(payload);
      
      case 'generateConflictResolutionSuggestion':
        return await generateConflictResolutionSuggestion(payload);
      
      case 'provideRealTimeConflictInsight':
        return await provideRealTimeConflictInsight(payload);
      
      case 'assessConflictResolutionProgress':
        return await assessConflictResolutionProgress(payload);
      
      case 'generatePersonalizedConflictAdvice':
        return await generatePersonalizedConflictAdvice(payload);
      
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }

  } catch (error) {
    console.error('Enhanced conflict resolution error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function analyzeConflictPattern(payload: { messages: Array<{ sender: string; content: string; timestamp: string }>; challengeContext: string }) {
  const systemPrompt = `You are an expert relationship counselor specializing in conflict pattern analysis. Analyze the provided messages for conflict patterns and provide detailed insights.

Your response must be a valid JSON object with this structure:
{
  "patternType": "escalation|defensiveness|stonewalling|criticism|contempt",
  "severity": <number 1-5>,
  "triggerPhrases": ["<phrase1>", "<phrase2>"],
  "emotionalImpact": "<description of emotional impact>",
  "underlyingNeeds": ["<need1>", "<need2>"],
  "resolutionStrategies": ["<strategy1>", "<strategy2>"],
  "immediateAction": "<specific immediate action to take>",
  "longTermSolution": "<long-term solution recommendation>"
}`;

  const userPrompt = `Analyze these messages for conflict patterns:

Context: ${payload.challengeContext}

Messages:
${payload.messages.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

Provide a comprehensive conflict analysis focusing on:
1. The specific conflict pattern(s) present
2. Severity level (1-5)
3. Trigger phrases that indicate the pattern
4. Emotional impact on both partners
5. Underlying needs not being met
6. Specific resolution strategies
7. Immediate actions to take
8. Long-term solutions`;

  try {
    const analysis = await callZAI(systemPrompt, userPrompt, supabase);
    const parsedAnalysis = JSON.parse(analysis);

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedAnalysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error analyzing conflict pattern:', error);
    throw error;
  }
}

async function generateConflictResolutionSuggestion(payload: { conflictAnalysis: ConflictAnalysis; previousExercises: ExerciseRecord[] }) {
  const systemPrompt = `You are an expert relationship counselor specializing in conflict resolution exercises. Generate personalized conflict resolution suggestions based on the conflict analysis and previous exercise history.

Your response must be a valid JSON object with this structure:
{
  "exerciseType": "active_listening|i_feel_statements|perspective_taking|de_escalation|repair_attempt",
  "suggestion": "<detailed exercise description>",
  "rationale": "<explanation of why this exercise is recommended>",
  "expectedOutcome": "<what partners should expect to achieve>",
  "timeRequired": <number in minutes>
}`;

  const userPrompt = `Generate a conflict resolution exercise suggestion based on:

Conflict Analysis:
- Pattern: ${payload.conflictAnalysis.patternType}
- Severity: ${payload.conflictAnalysis.severity}
- Emotional Impact: ${payload.conflictAnalysis.emotionalImpact}
- Underlying Needs: ${payload.conflictAnalysis.underlyingNeeds.join(', ')}

Previous Exercises:
${payload.previousExercises.map(ex => `- ${ex.exerciseType}: ${ex.effectiveness}/5 effectiveness`).join('\n')}

Recommend an appropriate exercise that:
1. Addresses the specific conflict pattern
2. Builds on previous exercise effectiveness
3. Is appropriate for the severity level
4. Takes into account the underlying needs`;

  try {
    const suggestion = await callZAI(systemPrompt, userPrompt, supabase);
    const parsedSuggestion = JSON.parse(suggestion);

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedSuggestion
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error generating conflict resolution suggestion:', error);
    throw error;
  }
}

async function provideRealTimeConflictInsight(payload: { recentMessages: ConflictMessage[]; conflictPatterns: ConflictAnalysis[] }) {
  const systemPrompt = `You are an expert relationship counselor providing real-time conflict insights. Analyze recent messages and provide immediate, actionable insights.

Your response must be a valid JSON object with this structure:
{
  "insight": "<key insight about the current situation>",
  "patternAnalysis": "<analysis of the communication pattern>",
  "emotionalState": "<assessment of both partners' emotional states>",
  "communicationBreakdown": "<description of what's happening in communication>",
  "growthOpportunity": "<opportunity for growth and learning>",
  "immediateStep": "<specific immediate action to take>"
}`;

  const userPrompt = `Provide real-time conflict insight for these recent messages:

Recent Messages:
${payload.recentMessages.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

Previous Conflict Patterns:
${payload.conflictPatterns.map(pattern => `- ${pattern.patternType} (severity: ${pattern.severity})`).join('\n')}

Focus on:
1. What's happening right now in the conversation
2. The emotional dynamics between partners
3. How communication is breaking down
4. Immediate steps to improve the situation
5. Growth opportunities present`;

  try {
    const insight = await callZAI(systemPrompt, userPrompt, supabase);
    const parsedInsight = JSON.parse(insight);

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedInsight
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error providing real-time conflict insight:', error);
    throw error;
  }
}

async function assessConflictResolutionProgress(payload: { challengeId: string; conflictPatterns: ConflictAnalysis[]; completedExercises: Array<{ exerciseType: string; effectiveness: number }> }) {
  const systemPrompt = `You are an expert relationship counselor assessing conflict resolution progress. Analyze the couple's progress in resolving conflicts and improving communication.

Your response must be a valid JSON object with this structure:
{
  "overallProgress": <number 0-100>,
  "patternImprovement": {
    "escalation": <number 0-100>,
    "defensiveness": <number 0-100>,
    "stonewalling": <number 0-100>,
    "criticism": <number 0-100>,
    "contempt": <number 0-100>
  },
  "recommendedNextSteps": ["<step1>", "<step2>"],
  "confidenceLevel": "low|medium|high"
}`;

  const userPrompt = `Assess conflict resolution progress for challenge ${payload.challengeId}:

Conflict Patterns Detected:
${payload.conflictPatterns.map(pattern => `- ${pattern.patternType}: severity ${pattern.severity}, resolved: ${pattern.resolutionSuggested}`).join('\n')}

Completed Exercises:
${payload.completedExercises.map(ex => `- ${ex.exerciseType}: ${ex.effectiveness}/5 effectiveness`).join('\n')}

Provide an assessment of:
1. Overall progress in conflict resolution
2. Improvement in each conflict pattern type
3. Recommended next steps for continued growth
4. Confidence level in the assessment`;

  try {
    const assessment = await callZAI(systemPrompt, userPrompt, supabase);
    const parsedAssessment = JSON.parse(assessment);

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedAssessment
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error assessing conflict resolution progress:', error);
    throw error;
  }
}

async function generatePersonalizedConflictAdvice(payload: { userProfile: UserProfile; partnerProfile: UserProfile; currentConflict: ConflictAnalysis }) {
  const systemPrompt = `You are an expert relationship counselor providing personalized conflict advice. Generate tailored advice based on both partners' communication styles, emotional tendencies, and conflict history.

Your response must be a valid JSON object with this structure:
{
  "personalizedAdvice": "<tailored advice for this specific couple>",
  "communicationTips": ["<tip1>", "<tip2>", "<tip3>"],
  "emotionalRegulation": ["<technique1>", "<technique2>"],
  "relationshipStrengths": ["<strength1>", "<strength2>"]
}`;

  const userPrompt = `Generate personalized conflict advice for this couple:

User Profile:
- Communication Style: ${payload.userProfile.communicationStyle}
- Emotional Tendencies: ${payload.userProfile.emotionalTendencies.join(', ')}
- Conflict History: ${payload.userProfile.conflictHistory.join(', ')}

Partner Profile:
- Communication Style: ${payload.partnerProfile.communicationStyle}
- Emotional Tendencies: ${payload.partnerProfile.emotionalTendencies.join(', ')}
- Conflict History: ${payload.partnerProfile.conflictHistory.join(', ')}

Current Conflict:
- Pattern: ${payload.currentConflict.patternType}
- Severity: ${payload.currentConflict.severity}
- Emotional Impact: ${payload.currentConflict.emotionalImpact}

Provide:
1. Personalized advice that considers both partners' styles
2. Communication tips that work for their specific dynamic
3. Emotional regulation techniques for their tendencies
4. Recognition of their relationship strengths`;

  try {
    const advice = await callZAI(systemPrompt, userPrompt, supabase);
    const parsedAdvice = JSON.parse(advice);

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedAdvice
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error generating personalized conflict advice:', error);
    throw error;
  }
}
