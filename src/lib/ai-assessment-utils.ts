import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { AIService } from '@/services/ai/aiService';
import { AssessmentsEnhanced } from '@/integrations/supabase/tables/assessments_enhanced';
import { AssessmentAttempts } from '@/integrations/supabase/tables/assessment_attempts';
import { AssessmentResults } from '@/integrations/supabase/tables/assessment_results';
import { AiUsageLogs } from '@/integrations/supabase/tables/ai_usage_logs';
import { UserAssessmentProgress } from '@/integrations/supabase/tables/user_assessment_progress';
import { Json, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

const aiService = AIService.getInstance();

interface AIAnalysisResult {
  overall_analysis: string;
  strengths_identified: string[];
  growth_areas: string[];
  ai_score: number;
  ai_feedback: string;
  recommendations: string[];
}

export async function checkAiRateLimit(userId: string, providerName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: userId,
      p_provider_name: providerName,
    });

    if (error) {
      logger.error('Error checking AI rate limit:', error as Record<string, unknown>);
      return false;
    }
    return data as boolean;
  } catch (e) {
    logger.error('Exception checking AI rate limit:', e);
    return false;
  }
}

export async function incrementAiRateLimit(userId: string, providerName: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_ai_rate_limit', {
      p_user_id: userId,
      p_provider_name: providerName,
    });

    if (error) {
      logger.error('Error incrementing AI rate limit:', error as Record<string, unknown>);
    }
  } catch (e) {
    logger.error('Exception incrementing AI rate limit:', e);
  }
}

export async function processAssessmentWithAI(
  assessmentId: string,
  attemptId: string,
  userId: string,
  aiConfigId: string,
  responses: Record<string, string>
): Promise<AssessmentResults['Row'] | null> {
  try {
    const { data: assessmentRow, error: assessmentError } = await supabase
      .from('assessments_enhanced')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) throw assessmentError;
    if (!assessmentRow) throw new Error('Assessment not found.');

    const aiResponse = await aiService.generateAssessmentAnalysis(
      assessmentRow,
      { answers: responses, userId },
      aiConfigId
    );

    if (aiResponse.error) {
      await supabase
        .from('assessment_attempts')
        .update({ ai_processing_error: aiResponse.error, is_ai_processed: true } as TablesUpdate<'assessment_attempts'>)
        .eq('id', attemptId);
      throw new Error(`AI analysis failed: ${aiResponse.error}`);
    }

    const analysisResult = aiResponse.json as AIAnalysisResult;

    await supabase
      .from('assessment_attempts')
      .update({
        ai_analysis: analysisResult as unknown as Json,
        ai_score: analysisResult.ai_score,
        ai_feedback: analysisResult.ai_feedback,
        is_ai_processed: true,
        ai_processing_error: null,
      } as TablesUpdate<'assessment_attempts'>)
      .eq('id', attemptId);

    const percentageScore = analysisResult.ai_score;
    const passingScore = assessmentRow.passing_score ?? 70;
    const isPassed = percentageScore >= passingScore;

    const { data: resultData, error: resultError } = await supabase
      .from('assessment_results')
      .upsert(
        {
          assessment_id: assessmentId,
          user_id: userId,
          attempt_id: attemptId,
          answers: responses as Json,
          raw_score: percentageScore, // Using AI score as raw score for simplicity
          percentage_score: percentageScore,
          ai_feedback: analysisResult.ai_feedback,
          ai_insights: analysisResult.overall_analysis as Json,
          ai_recommendations: JSON.stringify(analysisResult.recommendations),
          strengths_identified: analysisResult.strengths_identified as Json,
          growth_areas: analysisResult.growth_areas as Json,
          overall_analysis: analysisResult.overall_analysis,
          is_passed: isPassed,
        } as TablesInsert<'assessment_results'>,
        { onConflict: 'attempt_id' }
      )
      .select()
      .single();

    if (resultError) throw resultError;

    // Log AI usage
    const aiConfig = aiService.getConfiguration(aiConfigId);
    if (aiConfig) {
      await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          attempt_id: attemptId,
          ai_config_id: aiConfigId,
          provider_name: aiConfig.provider_name || aiConfig.provider,
          model_name: aiConfig.model,
          tokens_used: aiResponse.tokensUsed,
          cost_usd: aiResponse.cost,
          processing_time_ms: aiResponse.processingTimeMs,
          success: true,
          error_message: null,
        } as TablesInsert<'ai_usage_logs'>);
    }

    return resultData;
  } catch (e) {
    logger.error('Error in processAssessmentWithAI:', e);
    await supabase
      .from('assessment_attempts')
      .update({ ai_processing_error: e instanceof Error ? e.message : 'Unknown AI processing error', is_ai_processed: true } as TablesUpdate<'assessment_attempts'>)
      .eq('id', attemptId);
    return null;
  }
}

export async function createAssessmentAttempt(
  assessmentId: string,
  userId: string,
  responses: Record<string, string>
): Promise<string | null> {
  try {
    const { data: existingAttempts } = await supabase
      .from('assessment_attempts')
      .select('attempt_number')
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;

    const { data, error } = await supabase
      .from('assessment_attempts')
      .insert({
        assessment_id: assessmentId,
        user_id: userId,
        attempt_number: attemptNumber,
        status: 'started',
        raw_responses: responses as Json,
        started_at: new Date().toISOString(),
      } as TablesInsert<'assessment_attempts'>)
      .select('id')
      .single();

    if (error) throw error;
    if (!data) { // Explicit null check
      throw new Error('Failed to create assessment attempt, no data returned.');
    }
    return data.id;
  } catch (e) {
    logger.error('Error creating assessment attempt:', e);
    return null;
  }
}

export async function updateAssessmentAttempt(
  attemptId: string,
  responses: Record<string, string>,
  timeSpentMinutes: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('assessment_attempts')
      .update({
        raw_responses: responses as Json,
        time_spent_minutes: timeSpentMinutes,
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as TablesUpdate<'assessment_attempts'>)
      .eq('id', attemptId);

    if (error) throw error;
  } catch (e) {
    logger.error('Error updating assessment attempt:', e);
  }
}

export async function updateAssessmentProgress(
  userId: string,
  assessmentId: string,
  attemptId: string,
  score: number
): Promise<void> {
  try {
    const { data: currentProgress, error: progressError } = await supabase
      .from('user_assessment_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId)
      .single();

    if (progressError && progressError.code !== 'PGRST116') throw progressError; // PGRST116 means no rows found

    const isNewRecord = !currentProgress;
    const isNewBestScore = isNewRecord || score > Number(currentProgress?.best_score || 0);

    if (isNewRecord) {
      const { error } = await supabase
        .from('user_assessment_progress')
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          best_score: score,
          best_attempt_id: attemptId,
          total_attempts: 1,
          last_attempt_at: new Date().toISOString(),
          is_completed: score >= 70,
          completion_date: score >= 70 ? new Date().toISOString() : null,
        } as TablesInsert<'user_assessment_progress'>);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_assessment_progress')
        .update({
          best_score: isNewBestScore ? score : currentProgress.best_score,
          best_attempt_id: isNewBestScore ? attemptId : currentProgress.best_attempt_id,
          total_attempts: Number(currentProgress.total_attempts ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
          is_completed: score >= 70 || currentProgress.is_completed,
          completion_date: score >= 70 && !currentProgress.is_completed ? new Date().toISOString() : currentProgress.completion_date
        } as TablesUpdate<'user_assessment_progress'>)
        .eq('id', currentProgress.id);
      if (error) throw error;
    }
  } catch (e) {
    logger.error('Error updating assessment progress:', e);
  }
}