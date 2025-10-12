import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ProcessAssessmentPayload {
  attemptId: string;
  assessmentId: string;
  userId: string;
  responses: Record<string, unknown>;
  timeSpentMinutes: number;
}

// Z.AI API Integration (GLM-4.6) - Coding Subscription
async function analyzeWithZAI(assessmentContext: any, aiConfig: any) {
  const zaiApiKey = Deno.env.get('ZAI_API_KEY');
  const zaiBaseUrl = Deno.env.get('ZAI_BASE_URL') || 'https://api.z.ai/api/coding/paas/v4';
  const zaiModel = Deno.env.get('ZAI_MODEL') || 'glm-4.6';

  if (!zaiApiKey) {
    throw new Error('Z.AI API key not configured');
  }

  const systemPrompt = aiConfig.system_prompt || `You are an expert psychologist and personal growth coach. Analyze user responses to assessment questions and provide detailed, personalized feedback.

Your response must be a valid JSON object with this exact structure:
{
  "score": <number between 0-100>,
  "feedback": "<warm, personalized feedback about their responses>",
  "explanation": "<detailed explanation of their results>",
  "insights": ["<key insight 1>", "<key insight 2>", "<key insight 3>"],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", "<actionable recommendation 3>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "areas_for_improvement": ["<area 1>", "<area 2>"]
}

Be encouraging, insightful, and specific to their answers. Help them see patterns and opportunities for growth.`;

  const userPrompt = `Please analyze this assessment attempt:

Assessment: ${assessmentContext.title}
Category: ${assessmentContext.category}
Difficulty: ${assessmentContext.difficulty}

Questions and User Responses:
${JSON.stringify(assessmentContext.questions, null, 2)}
${JSON.stringify(assessmentContext.responses, null, 2)}

Time Spent: ${assessmentContext.timeSpent} minutes
Scoring Rubric: ${JSON.stringify(assessmentContext.scoringRubric, null, 2)}
Passing Score: ${assessmentContext.passingScore}

Provide a comprehensive analysis with score, feedback, insights, and recommendations. Return ONLY valid JSON.`;

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
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: aiConfig.temperature || 0.6,
      max_tokens: aiConfig.max_tokens || 2000,
      stream: false,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Z.AI API error: ${errorText}`);
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
    const payload: ProcessAssessmentPayload = await req.json();
    const { attemptId, assessmentId, userId, responses, timeSpentMinutes } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments_enhanced')
      .select('*, ai_assessment_configs(*)')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error('Assessment not found');
    }

    // Get AI configuration
    let aiConfig = assessment.ai_assessment_configs;
    
    if (!aiConfig) {
      const { data: defaultConfig } = await supabase
        .from('ai_assessment_configs')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      aiConfig = defaultConfig;
    }

    if (!aiConfig) {
      throw new Error('No AI configuration found');
    }

    // Prepare assessment context
    const assessmentContext = {
      title: assessment.title,
      description: assessment.description,
      category: assessment.category,
      difficulty: assessment.difficulty_level,
      questions: assessment.questions,
      responses: responses,
      timeSpent: timeSpentMinutes,
      scoringRubric: assessment.scoring_rubric,
      passingScore: assessment.passing_score
    };

    console.log('Processing assessment with Z.AI GLM-4.6...');
    const startTime = Date.now();

    // Call Z.AI for analysis
    const aiResult = await analyzeWithZAI(assessmentContext, aiConfig);
    const processingTime = Date.now() - startTime;

    // Parse AI response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResult.content);
    } catch (e) {
      // If JSON parsing fails, create a structured response
      aiAnalysis = {
        score: 70,
        feedback: aiResult.content,
        explanation: "AI analysis completed",
        insights: [],
        recommendations: [],
        strengths: [],
        areas_for_improvement: []
      };
    }

    // Validate score
    if (typeof aiAnalysis.score !== 'number' || aiAnalysis.score < 0 || aiAnalysis.score > 100) {
      aiAnalysis.score = 70; // Default score if invalid
    }

    // Update the assessment attempt
    const { error: updateError } = await supabase
      .from('assessment_attempts')
      .update({
        ai_analysis: aiAnalysis,
        ai_score: aiAnalysis.score,
        ai_feedback: aiAnalysis.feedback,
        ai_explanation: aiAnalysis.explanation,
        is_ai_processed: true,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', attemptId);

    if (updateError) {
      throw updateError;
    }

    // Log AI usage
    const tokensUsed = aiResult.usage?.total_tokens || 0;
    const costPer1kTokens = 0.001; // Z.AI GLM-4.6 is much cheaper than GPT-4
    const cost = (tokensUsed / 1000) * costPer1kTokens;

    await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        attempt_id: attemptId,
        ai_config_id: aiConfig.id,
        provider_name: 'zai',
        model_name: Deno.env.get('ZAI_MODEL') || 'glm-4.6',
        tokens_used: tokensUsed,
        cost_usd: cost,
        processing_time_ms: processingTime,
        success: true
      });

    // Update user progress
    const { data: existingProgress } = await supabase
      .from('user_assessment_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId)
      .single();

    if (existingProgress) {
      const shouldUpdate = !existingProgress.best_score || aiAnalysis.score > existingProgress.best_score;
      
      if (shouldUpdate) {
        await supabase
          .from('user_assessment_progress')
          .update({
            best_score: aiAnalysis.score,
            best_attempt_id: attemptId,
            last_attempt_at: new Date().toISOString(),
            total_attempts: existingProgress.total_attempts + 1,
            is_completed: aiAnalysis.score >= assessment.passing_score,
            completion_date: aiAnalysis.score >= assessment.passing_score ? new Date().toISOString() : null
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('user_assessment_progress')
          .update({
            last_attempt_at: new Date().toISOString(),
            total_attempts: existingProgress.total_attempts + 1
          })
          .eq('id', existingProgress.id);
      }
    } else {
      await supabase
        .from('user_assessment_progress')
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          best_score: aiAnalysis.score,
          best_attempt_id: attemptId,
          last_attempt_at: new Date().toISOString(),
          total_attempts: 1,
          is_completed: aiAnalysis.score >= assessment.passing_score,
          completion_date: aiAnalysis.score >= assessment.passing_score ? new Date().toISOString() : null
        });
    }

    // Trigger gamification if passed
    if (aiAnalysis.score >= assessment.passing_score) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gamification-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            type: 'complete_assessment',
            payload: {
              userId: userId,
              assessmentId: assessmentId
            }
          })
        });
      } catch (gamError) {
        console.error('Gamification error (non-critical):', gamError);
      }
    }

    console.log(`Assessment processed successfully with Z.AI. Score: ${aiAnalysis.score}, Tokens: ${tokensUsed}, Cost: $${cost.toFixed(4)}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: aiAnalysis,
        attemptId: attemptId,
        provider: 'Z.AI GLM-4.6',
        tokensUsed: tokensUsed,
        cost: cost
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing assessment:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        fallbackMessage: 'Your assessment has been submitted but AI analysis is temporarily unavailable. Your responses have been saved.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
