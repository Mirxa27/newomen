import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { AIService } from '@/services/ai/aiService';
import { PostgrestError } from '@supabase/supabase-js';

interface AIAnalysisResult {
  overall_analysis: string;
  strengths_identified: string[];
  growth_areas: string[];
  ai_score: number;
  ai_feedback: string;
  recommendations: string[];
}

const aiService = AIService.getInstance();

export const checkAIRateLimit = async (userId: string, providerName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: userId,
      p_provider_name: providerName,
    });
    if (error) throw error;
    return data;
  } catch (e) {
    logger.error('Error checking AI rate limit:', e as Record<string, unknown>);
    return false;
  }
};

export const incrementAIRateLimit = async (userId: string, providerName: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_ai_rate_limit', {
      p_user_id: userId,
      p_provider_name: providerName,
    });
    if (error) throw error;
  } catch (e) {
    logger.error('Error incrementing AI rate limit:', e as Record<string, unknown>);
  }
};

export const getAssessmentAndConfig = async (assessmentId: string) => {
  const { data: assessment, error } = await supabase
    .from('assessments_enhanced')
    .select('*, ai_configurations(*)')
    .eq('id', assessmentId)
    .single();

  if (error) throw error;
  return assessment as (Tables<'assessments_enhanced'> & { ai_configurations: Tables<'ai_configurations'> | null });
};

export const saveInitialAttempt = async (assessmentId: string, userId: string, attemptNumber: number, rawResponses: Json) => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .insert({
      assessment_id: assessmentId,
      user_id: userId,
      attempt_number: attemptNumber,
      status: 'in-progress',
      raw_responses: rawResponses,
    } as TablesInsert<'assessment_attempts'>)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAttemptWithAIResult = async (attemptId: string, analysisResult: AIAnalysisResult) => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      ai_analysis: analysisResult as unknown as Json,
      ai_score: analysisResult.ai_score,
      ai_feedback: analysisResult.ai_feedback,
    } as TablesUpdate<'assessment_attempts'>)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveAssessmentResult = async (
  assessment: Tables<'assessments_enhanced'>,
  attempt: Tables<'assessment_attempts'>,
  analysisResult: AIAnalysisResult
) => {
  const percentageScore = (analysisResult.ai_score / 100) * 100;
  const isPassed = percentageScore >= (assessment.passing_score || 0);

  const { data, error } = await supabase
    .from('assessment_results')
    .insert({
      assessment_id: assessment.id,
      user_id: attempt.user_id,
      attempt_id: attempt.id,
      answers: attempt.raw_responses,
      raw_score: analysisResult.ai_score,
      percentage_score: percentageScore,
      is_passed: isPassed,
      ai_feedback: analysisResult.ai_feedback,
      ai_insights: analysisResult as unknown as Json,
    } as TablesInsert<'assessment_results'>);

  if (error) throw error;
  return data;
};

export const logAIUsage = async (
  userId: string,
  assessmentId: string,
  attemptId: string,
  config: Tables<'ai_configurations'>,
  usage: { tokens_used: number; cost_usd: number; processing_time_ms: number; success: boolean; error_message?: string }
) => {
  const { error } = await supabase.from('ai_usage_logs').insert({
    user_id: userId,
    assessment_id: assessmentId,
    attempt_id: attemptId,
    ai_config_id: config.id,
    provider_name: config.provider,
    model_name: config.model_name,
    ...usage,
  } as TablesInsert<'ai_usage_logs'>);

  if (error) {
    logger.error('Error logging AI usage:', error as unknown as Record<string, unknown>);
  }
};

export const updateAttemptError = async (attemptId: string, errorMessage: string) => {
  const { error } = await supabase
    .from('assessment_attempts')
    .update({
      status: 'error',
      ai_feedback: errorMessage,
    } as TablesUpdate<'assessment_attempts'>)
    .eq('id', attemptId);

  if (error) {
    logger.error('Error updating attempt with error status:', error as unknown as Record<string, unknown>);
  }
};

export const getLatestAttemptNumber = async (assessmentId: string, userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .select('attempt_number')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.attempt_number || 0;
};

export const createNewAttempt = async (assessmentId: string, userId: string, rawResponses: Json) => {
  const latestAttemptNumber = await getLatestAttemptNumber(assessmentId, userId);
  const newAttemptNumber = latestAttemptNumber + 1;

  const { data, error } = await supabase
    .from('assessment_attempts')
    .insert({
      assessment_id: assessmentId,
      user_id: userId,
      attempt_number: newAttemptNumber,
      status: 'in-progress',
      raw_responses: rawResponses,
    } as TablesInsert<'assessment_attempts'>)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const finalizeAttempt = async (attemptId: string, updates: TablesUpdate<'assessment_attempts'>) => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...updates,
    })
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserAssessmentProgress = async (
  userId: string,
  assessmentId: string,
  result: Tables<'assessment_results'>,
  attempt: Tables<'assessment_attempts'>
) => {
  const { data: progress, error: progressError } = await supabase
    .from('user_assessment_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('assessment_id', assessmentId)
    .single();

  if (progressError && progressError.code !== 'PGRST116') throw progressError;

  if (progress) {
    const bestScore = Math.max(progress.best_score || 0, result.percentage_score || 0);
    const isCompleted = progress.is_completed || result.is_passed;

    const { error } = await supabase
      .from('user_assessment_progress')
      .update({
        best_score: bestScore,
        best_attempt_id: bestScore > (progress.best_score || 0) ? attempt.id : progress.best_attempt_id,
        total_attempts: (progress.total_attempts || 0) + 1,
        last_attempt_at: new Date().toISOString(),
        is_completed: isCompleted,
        completion_date: isCompleted && !progress.is_completed ? new Date().toISOString() : progress.completion_date,
      } as TablesUpdate<'user_assessment_progress'>)
      .eq('id', progress.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_assessment_progress').insert({
      user_id: userId,
      assessment_id: assessmentId,
      best_score: result.percentage_score,
      best_attempt_id: attempt.id,
      total_attempts: 1,
      last_attempt_at: new Date().toISOString(),
      is_completed: result.is_passed,
      completion_date: result.is_passed ? new Date().toISOString() : null,
    } as TablesInsert<'user_assessment_progress'>);
    if (error) throw error;
  }
};

// Added missing exported function
export const submitAssessmentResponses = async (
  assessmentId: string,
  userId: string,
  answers: Record<string, string>
): Promise<{ success: boolean; result?: Tables<'assessment_results'> | null; analysis?: AIAnalysisResult; error?: string }> => {
  try {
    const assessmentData = await getAssessmentAndConfig(assessmentId);
    const attempt = await createNewAttempt(assessmentId, userId, answers as unknown as Json);

    if (!assessmentData.ai_configurations) {
      throw new Error("Assessment is not linked to an AI configuration.");
    }

    const aiResponse = await aiService.generateAssessmentAnalysis(assessmentData, { answers, userId }, assessmentData.ai_config_id!);
    
    if (aiResponse.error || !aiResponse.json) {
      throw new Error(aiResponse.error || "AI analysis failed.");
    }

    const analysisResult = aiResponse.json as unknown as AIAnalysisResult;
    const finalAttempt = await updateAttemptWithAIResult(attempt.id, analysisResult);
    const result = await saveAssessmentResult(assessmentData, finalAttempt, analysisResult);
    await updateUserAssessmentProgress(userId, assessmentId, result!, finalAttempt);
    await logAIUsage(userId, assessmentId, attempt.id, assessmentData.ai_configurations, {
      tokens_used: aiResponse.tokensUsed || 0,
      cost_usd: aiResponse.cost || 0,
      processing_time_ms: aiResponse.processingTimeMs || 0,
      success: true,
    });

    return { success: true, result, analysis: analysisResult };
  } catch (e) {
    logger.error("Error submitting assessment:", e);
    return { success: false, error: e instanceof Error ? e.message : "An unknown error occurred." };
  }
};