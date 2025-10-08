import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { aiService } from "@/services/ai/aiService";
import type { AssessmentSubmission as AIServiceSubmission, AssessmentAnswers } from "@/types/ai-types";

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
  weight?: number;
}

export interface AssessmentSubmission {
  assessment_id: string;
  user_id: string;
  responses: AssessmentAnswers;
  time_spent_minutes: number;
  attempt_id?: string;
  attempt_number?: number;
}

export interface AIAnalysisResult {
  score: number;
  feedback: string;
  explanation: string;
  insights: string[];
  recommendations: string[];
  strengths: string[];
  areas_for_improvement: string[];
}

export interface Assessment {
  id?: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  scoring_rubric?: Record<string, unknown>;
  time_limit_minutes?: number | null;
  difficulty_level?: string | null;
  max_attempts?: number | null;
  ai_config_id?: string | null;
  [key: string]: unknown;
}

export interface AssessmentResults {
  id: string;
  assessment_id: string;
  user_id: string;
  raw_responses: Record<string, unknown>;
  ai_analysis?: AIAnalysisResult;
  score?: number;
  time_spent_minutes: number;
  status: string;
  completed_at?: string;
  assessments_enhanced?: {
    title: string;
    description?: string;
    type: string;
  };
  [key: string]: unknown;
}

/**
 * Check if user has exceeded AI rate limits
 */
export async function checkAIRateLimit(userId: string, providerName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: userId,
      p_provider_name: providerName,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error checking rate limit:", error);
    return false;
  }
}

/**
 * Increment AI rate limit counter
 */
export async function incrementAIRateLimit(userId: string, providerName: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_ai_rate_limit', {
      p_user_id: userId,
      p_provider_name: providerName,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error incrementing rate limit:", error);
  }
}

/**
 * Process assessment submission with AI
 */
export async function processAssessmentWithAI(
  assessmentId: string,
  submission: AssessmentSubmission
): Promise<AIAnalysisResult | null> {
  try {
    const runtimeConfig = await aiService.configService.getConfigurationForService(
      "assessment_scoring",
      assessmentId
    );

    if (!runtimeConfig) {
      throw new Error("No active AI configuration available for this assessment");
    }

    const providerName = runtimeConfig.provider ?? "openai";
    const withinRateLimit = await checkAIRateLimit(submission.user_id, providerName);
    if (!withinRateLimit) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const { data: assessmentRow, error: assessmentError } = await supabase
      .from("assessments_enhanced")
      .select("passing_score")
      .eq("id", assessmentId)
      .single();

    if (assessmentError) throw assessmentError;

    const aiSubmission: AIServiceSubmission = {
      assessment_id: assessmentId,
      user_id: submission.user_id,
      answers: submission.responses,
    };

    const aiResponse = await aiService.generateAssessmentResult(aiSubmission, runtimeConfig.id);

    if (!aiResponse.success || !aiResponse.content) {
      throw new Error(aiResponse.error ?? "AI analysis did not return a response");
    }

    const analysisResult = parseAIResponse(aiResponse.content);

    if (submission.attempt_id) {
      await supabase
        .from("assessment_attempts")
        .update({
          ai_analysis: analysisResult as unknown as Json,
          ai_score: analysisResult.score,
          ai_feedback: analysisResult.feedback,
          is_ai_processed: true,
          ai_processing_error: null,
        })
        .eq("id", submission.attempt_id);
    }

    const passingScore = assessmentRow?.passing_score ?? 70;

    await supabase
      .from("assessment_results")
      .upsert(
        {
          assessment_id: assessmentId,
          user_id: submission.user_id,
          answers: submission.responses as unknown as Json,
          raw_score: analysisResult.score,
          percentage_score: analysisResult.score,
          ai_feedback: analysisResult.feedback,
          ai_insights: analysisResult.insights as unknown as Json,
          ai_recommendations: analysisResult.recommendations.join("\n"),
          strengths_identified: analysisResult.strengths as unknown as Json,
          areas_for_improvement: analysisResult.areas_for_improvement as unknown as Json,
          detailed_explanations: analysisResult.explanation
            ? ({ explanation: analysisResult.explanation } as Json)
            : null,
          processing_time_ms: aiResponse.processing_time_ms,
          ai_model_used: runtimeConfig.model,
          attempt_number: submission.attempt_number ?? 1,
          is_passed: analysisResult.score >= passingScore,
        },
        { onConflict: "assessment_id,user_id,attempt_number" }
      );

    if (submission.attempt_id) {
      await updateUserProgress(submission.user_id, assessmentId, analysisResult.score, submission.attempt_id);
    }

    await logAIUsage({
      user_id: submission.user_id,
      assessment_id: assessmentId,
      attempt_id: submission.attempt_id ?? null,
      ai_config_id: runtimeConfig.id,
      provider_name: runtimeConfig.provider,
      model_name: runtimeConfig.model,
      tokens_used: aiResponse.usage?.total_tokens ?? 0,
      cost_usd: aiResponse.cost_usd ?? 0,
      processing_time_ms: aiResponse.processing_time_ms,
      success: true,
    });

    await incrementAIRateLimit(submission.user_id, providerName);

    return analysisResult;
  } catch (error) {
    console.error("Error processing assessment with AI:", error);

    await logAIUsage({
      user_id: submission.user_id,
      assessment_id: assessmentId,
      attempt_id: submission.attempt_id ?? null,
      ai_config_id: null,
      provider_name: "openai",
      model_name: "unknown",
      tokens_used: 0,
      cost_usd: 0,
      processing_time_ms: 0,
      success: false,
      error_message: error instanceof Error ? error.message : "Unknown error"
    });

    return null;
  }
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response: string): AIAnalysisResult {
  try {
    const parsed = JSON.parse(response);
    const traits = parsed.traits || parsed.coreThemes || parsed.insights || [];
    const strengths = parsed.strengths || parsed.strengthPatterns || [];
    const improvements = parsed.areas_for_improvement || parsed.improvements || [];
    const recommendations =
      parsed.recommendations || parsed.recommended_practices || parsed.transformationOpportunities || [];

    return {
      score: parsed.score || 0,
      feedback: parsed.feedback || "No feedback available",
      explanation: parsed.explanation || "No explanation available",
      insights: Array.isArray(traits) ? traits : [],
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      strengths: Array.isArray(strengths) ? strengths : [],
      areas_for_improvement: Array.isArray(improvements) ? improvements : []
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return {
      score: 0,
      feedback: "Error processing AI response",
      explanation: "Unable to analyze your responses at this time",
      insights: [],
      recommendations: [],
      strengths: [],
      areas_for_improvement: []
    };
  }
}

/**
 * Log AI usage for monitoring and billing
 */
async function logAIUsage(logData: {
  user_id: string;
  assessment_id: string;
  attempt_id: string | null;
  ai_config_id: string | null;
  provider_name: string;
  model_name: string;
  tokens_used: number;
  cost_usd: number;
  processing_time_ms: number;
  success: boolean;
  error_message?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from("ai_usage_logs")
      .insert({
        user_id: logData.user_id,
        assessment_id: logData.assessment_id,
        attempt_id: logData.attempt_id,
        ai_config_id: logData.ai_config_id,
        provider_name: logData.provider_name,
        model_name: logData.model_name,
        tokens_used: logData.tokens_used,
        cost_usd: logData.cost_usd,
        processing_time_ms: logData.processing_time_ms,
        success: logData.success,
        error_message: logData.error_message
      });

    if (error) throw error;
  } catch (error) {
    console.error("Error logging AI usage:", error);
  }
}

/**
 * Create assessment attempt
 */
export async function createAssessmentAttempt(
  assessmentId: string,
  userId: string
): Promise<string | null> {
  try {
    // Get user's attempt number
    const { data: existingAttempts, error: countError } = await supabase
      .from("assessment_attempts")
      .select("attempt_number")
      .eq("assessment_id", assessmentId)
      .eq("user_id", userId)
      .order("attempt_number", { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;

    // Create new attempt
    const { data, error } = await supabase
      .from("assessment_attempts")
      .insert({
        assessment_id: assessmentId,
        user_id: userId,
        attempt_number: attemptNumber,
        status: 'in_progress',
        raw_responses: {} as Json
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error creating assessment attempt:", error);
    return null;
  }
}

/**
 * Submit assessment responses
 */
export async function submitAssessmentResponses(
  attemptId: string,
  responses: Record<string, unknown>,
  timeSpentMinutes: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("assessment_attempts")
      .update({
        raw_responses: responses as unknown as Json,
        time_spent_minutes: timeSpentMinutes,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq("id", attemptId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error submitting assessment responses:", error);
    return false;
  }
}

/**
 * Get assessment results
 */
export async function getAssessmentResults(attemptId: string): Promise<AssessmentResults | null> {
  try {
    const { data, error } = await supabase
      .from("assessment_attempts")
      .select(`
        *,
        assessments_enhanced (
          title,
          description,
          type
        )
      `)
      .eq("id", attemptId)
      .single();

    if (error) throw error;

    // Convert the data to match AssessmentResults interface
    if (data) {
      return {
        ...data,
        raw_responses: (data.raw_responses as unknown) as Record<string, unknown>,
        ai_analysis: (data.ai_analysis as unknown) as AIAnalysisResult | undefined
      } as unknown as AssessmentResults;
    }

    return null;
  } catch (error) {
    console.error("Error fetching assessment results:", error);
    return null;
  }
}

/**
 * Update user assessment progress
 */
export async function updateUserProgress(
  userId: string,
  assessmentId: string,
  score: number,
  attemptId: string
): Promise<void> {
  try {
    // Get current progress
    const { data: currentProgress, error: fetchError } = await supabase
      .from("user_assessment_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    const isNewRecord = !currentProgress;
    const isNewBestScore = isNewRecord || score > Number(currentProgress?.best_score || 0);

    if (isNewRecord) {
      // Create new progress record
      const { error: insertError } = await supabase
        .from("user_assessment_progress")
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          best_score: score,
          best_attempt_id: attemptId,
          total_attempts: 1,
          last_attempt_at: new Date().toISOString(),
          is_completed: score >= 70, // Assuming 70% is passing
          completion_date: score >= 70 ? new Date().toISOString() : null
        });

      if (insertError) throw insertError;
    } else {
      // Update existing progress
      const { error: updateError } = await supabase
        .from("user_assessment_progress")
        .update({
          best_score: isNewBestScore ? score : currentProgress.best_score,
          best_attempt_id: isNewBestScore ? attemptId : currentProgress.best_attempt_id,
          total_attempts: Number(currentProgress.total_attempts ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
          is_completed: score >= 70 || currentProgress.is_completed,
          completion_date: score >= 70 && !currentProgress.is_completed ? new Date().toISOString() : currentProgress.completion_date
        })
        .eq("id", currentProgress.id);

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error("Error updating user progress:", error);
  }
}
