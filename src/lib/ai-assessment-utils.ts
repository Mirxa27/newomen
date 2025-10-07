import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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
  responses: Record<string, unknown>;
  time_spent_minutes: number;
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

export interface EvaluationCriteria {
  scoring_rubric?: string;
  criteria?: string[];
  weight?: Record<string, number>;
  [key: string]: unknown;
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

export interface UserProfile {
  id: string;
  nickname?: string;
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

export interface AIConfig {
  id: string;
  name: string;
  provider_id: string;
  model_id: string;
  use_case_id: string;
  behavior_id?: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  evaluation_criteria: EvaluationCriteria;
  fallback_message: string;
  is_active: boolean;
}

/**
 * Get AI configuration for a specific assessment
 */
export async function getAIConfigForAssessment(assessmentId: string): Promise<AIConfig | null> {
  try {
    const result = await supabase
      .from("assessments_enhanced")
      .select(`
        ai_assessment_configs (
          id,
          name,
          provider_id,
          model_id,
          use_case_id,
          behavior_id,
          temperature,
          max_tokens,
          system_prompt,
          evaluation_criteria,
          fallback_message,
          is_active
        )
      `)
      .eq("id", assessmentId)
      .eq("is_active", true)
      .single();

    if (result.error) throw result.error;
    return result.data?.ai_assessment_configs as unknown as AIConfig;
  } catch (error) {
    console.error("Error fetching AI config:", error);
    return null;
  }
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
    // Get AI configuration
    const aiConfig = await getAIConfigForAssessment(assessmentId);
    if (!aiConfig) {
      throw new Error("No AI configuration found for this assessment");
    }

    // Check rate limits
    const withinRateLimit = await checkAIRateLimit(submission.user_id, "openai");
    if (!withinRateLimit) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    // Get assessment details
    const assessmentResult = await supabase
      .from("assessments_enhanced")
      .select("title, questions, scoring_rubric")
      .eq("id", assessmentId)
      .single();

    if (assessmentResult.error) throw assessmentResult.error;

    const assessmentData = assessmentResult.data as Record<string, unknown>;

    // Convert Json questions to AssessmentQuestion array
    const questions = Array.isArray(assessmentData.questions)
      ? assessmentData.questions as AssessmentQuestion[]
      : [];

    // Get user profile for context
    const userProfileResult = await supabase
      .from("user_profiles")
      .select("nickname, email")
      .eq("user_id", submission.user_id)
      .single();

    if (userProfileResult.error) throw userProfileResult.error;

    const userProfile = {
      id: submission.user_id,
      nickname: userProfileResult.data?.nickname || 'User'
    };

    // Prepare AI prompt
    const assessmentInput = {
      ...assessmentData,
      questions,
      title: assessmentData.title as string
    } as Assessment;
    const aiPrompt = prepareAIAssessmentPrompt(
      assessmentInput,
      submission.responses,
      userProfile,
      aiConfig
    );

    // Call AI provider
    const aiResponse = await callAIProvider(aiConfig, aiPrompt);

    // Parse AI response
    const analysisResult = parseAIResponse(aiResponse);

    // Log AI usage
    await logAIUsage({
      user_id: submission.user_id,
      assessment_id: assessmentId,
      ai_config_id: aiConfig.id,
      provider_name: "openai",
      model_name: "gpt-4",
      tokens_used: estimateTokens(aiPrompt + aiResponse),
      cost_usd: calculateCost(estimateTokens(aiPrompt + aiResponse)),
      processing_time_ms: 0, // This would be measured in real implementation
      success: true
    });

    // Increment rate limit
    await incrementAIRateLimit(submission.user_id, "openai");

    return analysisResult;
  } catch (error) {
    console.error("Error processing assessment with AI:", error);

    // Log failed AI usage
    await logAIUsage({
      user_id: submission.user_id,
      assessment_id: assessmentId,
      ai_config_id: null,
      provider_name: "openai",
      model_name: "gpt-4",
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
 * Prepare AI prompt for assessment analysis
 */
function prepareAIAssessmentPrompt(
  assessment: Assessment,
  responses: Record<string, unknown>,
  userProfile: UserProfile,
  aiConfig: AIConfig
): string {
  const questions = assessment.questions || [];
  const scoringRubric = assessment.scoring_rubric || {};

  let prompt = `${aiConfig.system_prompt}\n\n`;
  prompt += `Assessment: ${assessment.title}\n`;
  prompt += `User: ${userProfile.nickname}\n\n`;
  prompt += `Questions and Responses:\n`;

  questions.forEach((question: AssessmentQuestion, index: number) => {
    prompt += `${index + 1}. ${question.question}\n`;
    prompt += `Response: ${responses[question.id] || 'No response'}\n\n`;
  });

  prompt += `Scoring Criteria: ${JSON.stringify(scoringRubric)}\n\n`;
  prompt += `Please provide a comprehensive analysis including:\n`;
  prompt += `1. Overall score (0-100)\n`;
  prompt += `2. Detailed feedback\n`;
  prompt += `3. Explanation of scoring\n`;
  prompt += `4. Key insights\n`;
  prompt += `5. Recommendations\n`;
  prompt += `6. Strengths identified\n`;
  prompt += `7. Areas for improvement\n\n`;
  prompt += `Format your response as JSON with the following structure:\n`;
  prompt += `{"score": number, "feedback": "string", "explanation": "string", "insights": ["string"], "recommendations": ["string"], "strengths": ["string"], "areas_for_improvement": ["string"]}`;

  return prompt;
}

/**
 * Call AI provider with the prepared prompt
 */
async function callAIProvider(aiConfig: AIConfig, prompt: string): Promise<string> {
  // This would integrate with the AI provider system we created earlier
  // For now, we'll simulate an AI response
  return JSON.stringify({
    score: Math.floor(Math.random() * 40) + 60, // 60-100
    feedback: "Based on your responses, you show strong self-awareness and emotional intelligence. Your answers demonstrate good understanding of personal growth principles.",
    explanation: "Your responses indicate a balanced approach to personal development with particular strength in emotional regulation and interpersonal skills.",
    insights: [
      "High emotional intelligence",
      "Strong self-reflection skills",
      "Good interpersonal awareness"
    ],
    recommendations: [
      "Continue developing emotional regulation techniques",
      "Practice active listening in relationships",
      "Set specific personal growth goals"
    ],
    strengths: [
      "Self-awareness",
      "Empathy",
      "Communication skills"
    ],
    areas_for_improvement: [
      "Stress management",
      "Boundary setting",
      "Conflict resolution"
    ]
  });
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response: string): AIAnalysisResult {
  try {
    const parsed = JSON.parse(response);
    return {
      score: parsed.score || 0,
      feedback: parsed.feedback || "No feedback available",
      explanation: parsed.explanation || "No explanation available",
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || [],
      strengths: parsed.strengths || [],
      areas_for_improvement: parsed.areas_for_improvement || []
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
        attempt_id: null, // This would be set when we have the attempt ID
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
 * Estimate token count for cost calculation
 */
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost based on token usage
 */
function calculateCost(tokens: number): number {
  // GPT-4 pricing: $0.03 per 1K tokens for input, $0.06 per 1K tokens for output
  // This is a simplified calculation
  return (tokens / 1000) * 0.03;
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
        raw_responses: {}
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
    const isNewBestScore = isNewRecord || score > (currentProgress?.best_score || 0);

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
          total_attempts: currentProgress.total_attempts + 1,
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