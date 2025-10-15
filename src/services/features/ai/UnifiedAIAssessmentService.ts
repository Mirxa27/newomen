import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { AssessmentAnswers } from "@/types/features/ai/ai-types";

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
  weight?: number;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  difficulty_level?: string | null;
  time_limit_minutes?: number | null;
  max_attempts?: number | null;
  passing_score?: number | null;
  ai_config_id?: string | null;
  questions: Json; // This will be AssessmentQuestion[] when parsed
  scoring_rubric?: Json | null;
  is_active?: boolean | null;
  is_public?: boolean | null;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id?: string | null;
  user_id?: string | null;
  attempt_number: number;
  started_at?: string | null;
  completed_at?: string | null;
  time_spent_minutes?: number | null;
  status?: string | null;
  raw_responses: Json;
  ai_analysis?: Json | null;
  ai_score?: number | null;
  ai_feedback?: string | null;
  ai_explanation?: string | null;
  is_ai_processed?: boolean | null;
  ai_processing_error?: string | null;
  created_at?: string | null;
}

export interface AIAnalysisResult {
  score: number;
  feedback: string;
  explanation: string;
  insights?: string[];
  recommendations?: string[];
  strengths?: string[];
  areas_for_improvement?: string[];
  is_passing?: boolean;
}

export class UnifiedAIAssessmentService {
  private static instance: UnifiedAIAssessmentService;

  static getInstance(): UnifiedAIAssessmentService {
    if (!this.instance) {
      this.instance = new UnifiedAIAssessmentService();
    }
    return this.instance;
  }

  /**
   * Get assessment by ID with proper typing
   */
  async getAssessment(assessmentId: string): Promise<Assessment | null> {
    try {
      const { data, error } = await supabase
        .from("assessments_enhanced")
        .select("*")
        .eq("id", assessmentId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching assessment:", error);
        return null;
      }

      return data as Assessment;
    } catch (error) {
      console.error("Error in getAssessment:", error);
      return null;
    }
  }

  /**
   * Create assessment attempt
   */
  async createAssessmentAttempt(
    assessmentId: string,
    userId: string
  ): Promise<string | null> {
    try {
      // Check existing attempts to get next attempt number
      const { data: existingAttempts, error: countError } = await supabase
        .from("assessment_attempts")
        .select("attempt_number")
        .eq("assessment_id", assessmentId)
        .eq("user_id", userId)
        .order("attempt_number", { ascending: false })
        .limit(1);

      if (countError) {
        console.error("Error counting attempts:", countError);
        return null;
      }

      const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;

      // Create new attempt
      const { data, error } = await supabase
        .from("assessment_attempts")
        .insert({
          assessment_id: assessmentId,
          user_id: userId,
          attempt_number: attemptNumber,
          status: 'in_progress',
          raw_responses: {} as Json,
          started_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating assessment attempt:", error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error("Error in createAssessmentAttempt:", error);
      return null;
    }
  }

  /**
   * Submit assessment responses
   */
  async submitAssessmentResponses(
    attemptId: string,
    responses: AssessmentAnswers,
    timeSpentMinutes: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("assessment_attempts")
        .update({
          raw_responses: responses as Json,
          time_spent_minutes: timeSpentMinutes,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq("id", attemptId);

      if (error) {
        console.error("Error submitting responses:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in submitAssessmentResponses:", error);
      return false;
    }
  }

  /**
   * Process assessment with AI using Supabase Edge Function
   */
  async processAssessmentWithAI(
    assessmentId: string,
    attemptId: string,
    userId: string,
    responses: AssessmentAnswers,
    timeSpentMinutes: number
  ): Promise<AIAnalysisResult | null> {
    try {
      console.log('Processing assessment with AI:', {
        assessmentId,
        attemptId,
        userId,
        timeSpentMinutes
      });

      // Call the AI assessment processor function
      const { data, error } = await supabase.functions.invoke('ai-assessment-processor', {
        body: {
          attemptId,
          assessmentId,
          userId,
          responses,
          timeSpentMinutes
        }
      });

      if (error) {
        console.error('AI processing error:', error);
        throw error;
      }

      console.log('AI processing response:', data);

      if (data && data.success && data.analysis) {
        const analysis = data.analysis;
        
        return {
          score: analysis.score || 0,
          feedback: analysis.feedback || 'No feedback available',
          explanation: analysis.explanation || 'No explanation available',
          insights: analysis.insights || [],
          recommendations: analysis.recommendations || [],
          strengths: analysis.strengths || [],
          areas_for_improvement: analysis.areas_for_improvement || [],
          is_passing: analysis.is_passing || (analysis.score || 0) >= 70,
        };
      }

      throw new Error('Invalid AI response format');
    } catch (error) {
      console.error("Error processing assessment with AI:", error);
      
      // Update attempt with error
      await supabase
        .from("assessment_attempts")
        .update({
          ai_processing_error: error instanceof Error ? error.message : 'Unknown error',
          is_ai_processed: false
        })
        .eq("id", attemptId);

      return null;
    }
  }

  /**
   * Get assessment attempt by ID
   */
  async getAssessmentAttempt(attemptId: string): Promise<AssessmentAttempt | null> {
    try {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (error) {
        console.error("Error fetching attempt:", error);
        return null;
      }

      return data as AssessmentAttempt;
    } catch (error) {
      console.error("Error in getAssessmentAttempt:", error);
      return null;
    }
  }

  /**
   * Get user's assessment progress
   */
  async getUserAssessmentProgress(
    userId: string,
    assessmentId: string
  ): Promise<{
    total_attempts: number;
    best_score: number | null;
    is_completed: boolean;
    last_attempt_at: string | null;
  } | null> {
    try {
      const { data, error } = await supabase
        .from("user_assessment_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("assessment_id", assessmentId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        console.error("Error fetching progress:", error);
        return null;
      }

      return data || {
        total_attempts: 0,
        best_score: null,
        is_completed: false,
        last_attempt_at: null
      };
    } catch (error) {
      console.error("Error in getUserAssessmentProgress:", error);
      return null;
    }
  }

  /**
   * Update user assessment progress
   */
  async updateUserProgress(
    userId: string,
    assessmentId: string,
    score: number,
    attemptId: string,
    passingScore: number = 70
  ): Promise<void> {
    try {
      // Get current progress
      const currentProgress = await this.getUserAssessmentProgress(userId, assessmentId);
      
      if (!currentProgress || currentProgress.total_attempts === 0) {
        // Create new progress record
        const { error } = await supabase
          .from("user_assessment_progress")
          .insert({
            user_id: userId,
            assessment_id: assessmentId,
            best_score: score,
            best_attempt_id: attemptId,
            total_attempts: 1,
            last_attempt_at: new Date().toISOString(),
            is_completed: score >= passingScore,
            completion_date: score >= passingScore ? new Date().toISOString() : null
          });

        if (error) throw error;
      } else {
        // Update existing progress
        const isNewBest = !currentProgress.best_score || score > currentProgress.best_score;
        const isNowCompleted = score >= passingScore;
        
        const { error } = await supabase
          .from("user_assessment_progress")
          .update({
            best_score: isNewBest ? score : currentProgress.best_score,
            best_attempt_id: isNewBest ? attemptId : undefined,
            total_attempts: currentProgress.total_attempts + 1,
            last_attempt_at: new Date().toISOString(),
            is_completed: isNowCompleted || currentProgress.is_completed,
            completion_date: isNowCompleted && !currentProgress.is_completed ? new Date().toISOString() : undefined
          })
          .eq("user_id", userId)
          .eq("assessment_id", assessmentId);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating user progress:", error);
    }
  }

  /**
   * Check AI health status
   */
  async checkAIHealth(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assessment-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'health_check'
        })
      });

      if (!response.ok) {
        console.error('AI health check failed with status:', response.status);
        return false;
      }

      const result = await response.json();
      return result.success && result.status === 'healthy';
    } catch (error) {
      console.error('AI health check failed:', error);
      return false;
    }
  }

  /**
   * Parse assessment questions from JSON
   */
  parseAssessmentQuestions(questionsJson: Json): AssessmentQuestion[] {
    try {
      if (Array.isArray(questionsJson)) {
        return questionsJson as AssessmentQuestion[];
      }
      return [];
    } catch (error) {
      console.error("Error parsing questions:", error);
      return [];
    }
  }

  /**
   * Get all public assessments
   */
  async getPublicAssessments(): Promise<Assessment[]> {
    try {
      const { data, error } = await supabase
        .from("assessments_enhanced")
        .select("*")
        .eq("is_public", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching public assessments:", error);
        return [];
      }

      return data as Assessment[];
    } catch (error) {
      console.error("Error in getPublicAssessments:", error);
      return [];
    }
  }

  /**
   * Get assessments by category
   */
  async getAssessmentsByCategory(category: string): Promise<Assessment[]> {
    try {
      const { data, error } = await supabase
        .from("assessments_enhanced")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching assessments by category:", error);
        return [];
      }

      return data as Assessment[];
    } catch (error) {
      console.error("Error in getAssessmentsByCategory:", error);
      return [];
    }
  }
}

// Singleton instance
export const unifiedAIAssessmentService = UnifiedAIAssessmentService.getInstance();
