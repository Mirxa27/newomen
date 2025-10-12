import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessAssessmentPayload {
  attemptId: string;
  assessmentId: string;
  userId: string;
  responses: Record<string, unknown>;
  timeSpentMinutes: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: ProcessAssessmentPayload = await req.json();
    const { attemptId, assessmentId, userId, responses, timeSpentMinutes } = payload;

    // Initialize Supabase client
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

    // Get AI configuration for this assessment
    let aiConfig = assessment.ai_assessment_configs;
    
    // If no specific config, get the default one
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

    // Prepare the assessment context for AI analysis
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

    // Call OpenAI for analysis
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.ai_model || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: aiConfig.system_prompt || `You are an expert assessment analyzer. Analyze user responses to assessment questions and provide detailed feedback, scoring, and insights. 
            
Your response must be a valid JSON object with this structure:
{
  "score": <number between 0-100>,
  "feedback": "<personalized feedback string>",
  "explanation": "<detailed explanation string>",
  "insights": ["<insight 1>", "<insight 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "areas_for_improvement": ["<area 1>", "<area 2>", ...]
}`
          },
          {
            role: 'user',
            content: `Please analyze this assessment attempt:\n\n${JSON.stringify(assessmentContext, null, 2)}\n\nProvide a comprehensive analysis with score, feedback, insights, and recommendations.`
          }
        ],
        temperature: aiConfig.temperature || 0.7,
        max_tokens: aiConfig.max_tokens || 2000,
      }),
    });

    const processingTime = Date.now() - startTime;

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const aiResult = await openaiResponse.json();
    const aiContent = aiResult.choices[0].message.content;
    
    // Parse AI response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiContent);
    } catch (e) {
      // If JSON parsing fails, create a structured response
      aiAnalysis = {
        score: 70,
        feedback: aiContent,
        explanation: "AI analysis completed",
        insights: [],
        recommendations: [],
        strengths: [],
        areas_for_improvement: []
      };
    }

    // Update the assessment attempt with AI analysis
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
    const costPer1kTokens = 0.01; // Approximate cost for GPT-4
    const cost = (tokensUsed / 1000) * costPer1kTokens;

    await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        attempt_id: attemptId,
        ai_config_id: aiConfig.id,
        provider_name: aiConfig.ai_provider || 'openai',
        model_name: aiConfig.ai_model || 'gpt-4-turbo-preview',
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

    return new Response(
      JSON.stringify({
        success: true,
        analysis: aiAnalysis,
        attemptId: attemptId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing assessment:', error);

    // Log failed attempt
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const payload: ProcessAssessmentPayload = await req.json();
      
      await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: payload.userId,
          assessment_id: payload.assessmentId,
          attempt_id: payload.attemptId,
          provider_name: 'openai',
          model_name: 'gpt-4-turbo-preview',
          tokens_used: 0,
          cost_usd: 0,
          processing_time_ms: 0,
          success: false,
          error_message: error.message
        });

      // Update attempt with error
      await supabase
        .from('assessment_attempts')
        .update({
          ai_processing_error: error.message,
          is_ai_processed: false,
          status: 'completed'
        })
        .eq('id', payload.attemptId);
    } catch (logError) {
      console.error('Error logging failed attempt:', logError);
    }

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

