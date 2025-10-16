// Comprehensive business logic for assessment system
import { supabase } from '@/integrations/supabase/client';
import { errorHandler, ErrorFactory } from '@/utils/shared/core/error-handling';
import type { 
  AssessmentCreate, 
  AssessmentAttempt, 
  AssessmentResponse, 
  AIAnalysisResult,
  APIResponse 
} from '@/types/validation';
import type { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';

type AssessmentAttemptWithRelations = Database['public']['Tables']['assessment_attempts']['Row'] & {
    assessments: (Database['public']['Tables']['assessments']['Row'] & {
      questions: Database['public']['Tables']['assessment_questions']['Row'][];
    }) | null;
};

export interface AssessmentBusinessRules {
  maxAttemptsPerAssessment: number;
  timeLimitBuffer: number; // seconds
  minimumResponseTime: number; // seconds
  maximumResponseTime: number; // seconds
  requiredCompletionRate: number; // percentage
}

export interface AssessmentMetrics {
  completionRate: number;
  averageTimeSpent: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  successRate: number;
  userSatisfaction: number;
}

export class AssessmentBusinessLogic {
  private static instance: AssessmentBusinessLogic;
  private businessRules: AssessmentBusinessRules;

  private constructor() {
    this.businessRules = {
      maxAttemptsPerAssessment: 3,
      timeLimitBuffer: 30, // 30 seconds buffer
      minimumResponseTime: 5, // 5 seconds minimum
      maximumResponseTime: 3600, // 1 hour maximum
      requiredCompletionRate: 80, // 80% completion required
    };
  }

  public static getInstance(): AssessmentBusinessLogic {
    if (!AssessmentBusinessLogic.instance) {
      AssessmentBusinessLogic.instance = new AssessmentBusinessLogic();
    }
    return AssessmentBusinessLogic.instance;
  }

  // Create new assessment with business validation
  public async createAssessment(
    assessmentData: AssessmentCreate,
    userId: string
  ): Promise<APIResponse<{ id: string }>> {
    try {
      // Validate business rules
      const validation = this.validateAssessmentCreation(assessmentData);
      if (!validation.isValid) {
        throw ErrorFactory.validation(validation.error);
      }

      // Check user permissions
      const hasPermission = await this.checkUserPermission(userId, 'create_assessment');
      if (!hasPermission) {
        throw ErrorFactory.authorization('Insufficient permissions to create assessment');
      }

      // Create assessment
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          ...assessmentData,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      // Log assessment creation
      await this.logAssessmentEvent('assessment_created', {
        assessment_id: data.id,
        user_id: userId,
        title: assessmentData.title,
        type: assessmentData.type,
      });

      return {
        success: true,
        data: { id: data.id },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, { 
        operation: 'createAssessment',
        userId,
        assessmentData: assessmentData.title 
      });
    }
  }

  // Start assessment attempt with business logic
  public async startAssessmentAttempt(
    assessmentId: string,
    userId: string
  ): Promise<APIResponse<AssessmentAttempt>> {
    try {
      // Check if assessment exists and is active
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('is_active', true)
        .single();

      if (assessmentError || !assessment) {
        throw ErrorFactory.notFound('Assessment', assessmentId);
      }

      // Check user's attempt history
      const attemptCount = await this.getUserAttemptCount(assessmentId, userId);
      if (attemptCount >= this.businessRules.maxAttemptsPerAssessment) {
        throw ErrorFactory.conflict(
          `Maximum attempts (${this.businessRules.maxAttemptsPerAssessment}) exceeded for this assessment`
        );
      }

      // Check if user has an active attempt
      const activeAttempt = await this.getActiveAttempt(assessmentId, userId);
      if (activeAttempt) {
        throw ErrorFactory.conflict('You already have an active attempt for this assessment');
      }

      // Create new attempt
      const attemptNumber = attemptCount + 1;
      const { data, error } = await supabase
        .from('assessment_attempts')
        .insert({
          assessment_id: assessmentId,
          user_id: userId,
          attempt_number: attemptNumber,
          started_at: new Date().toISOString(),
          status: 'in_progress',
          time_spent_minutes: 0,
          raw_responses: {},
        })
        .select('*')
        .single();

      if (error) throw error;

      // Log attempt start
      await this.logAssessmentEvent('attempt_started', {
        assessment_id: assessmentId,
        user_id: userId,
        attempt_id: data.id,
        attempt_number: attemptNumber,
      });

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'startAssessmentAttempt',
        assessmentId,
        userId,
      });
    }
  }

  // Submit assessment response with validation
  public async submitAssessmentResponse(
    attemptId: string,
    questionId: string,
    response: unknown,
    userId: string
  ): Promise<APIResponse<{ success: boolean }>> {
    try {
      // Validate response
      const validation = this.validateResponse(response);
      if (!validation.isValid) {
        throw ErrorFactory.validation(validation.error);
      }

      // Get attempt details
      const { data: attempt, error: attemptError } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('user_id', userId)
        .single();

      if (attemptError || !attempt) {
        throw ErrorFactory.notFound('Assessment attempt', attemptId);
      }

      if (attempt.status !== 'in_progress') {
        throw ErrorFactory.conflict('Assessment attempt is not active');
      }

      // Update responses
      const currentResponses = attempt.raw_responses || {};
      const updatedResponses = {
        ...currentResponses,
        [questionId]: {
          response,
          submitted_at: new Date().toISOString(),
          time_spent_seconds: this.calculateResponseTime(attempt.started_at),
        },
      };

      const { error: updateError } = await supabase
        .from('assessment_attempts')
        .update({
          raw_responses: updatedResponses,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Log response submission
      await this.logAssessmentEvent('response_submitted', {
        attempt_id: attemptId,
        question_id: questionId,
        user_id: userId,
        response_type: typeof response,
      });

      return {
        success: true,
        data: { success: true },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'submitAssessmentResponse',
        attemptId,
        questionId,
        userId,
      });
    }
  }

  // Complete assessment with business logic
  public async completeAssessment(
    attemptId: string,
    userId: string
  ): Promise<APIResponse<AIAnalysisResult>> {
    try {
      // Get attempt and assessment details
      const { data: attempt, error: attemptError } = await supabase
        .from('assessment_attempts')
        .select(`
          *,
          assessments (
            *,
            questions (
              *
            )
          )
        `)
        .eq('id', attemptId)
        .eq('user_id', userId)
        .single();

      if (attemptError || !attempt) {
        throw ErrorFactory.notFound('Assessment attempt', attemptId);
      }

      if (attempt.status !== 'in_progress') {
        throw ErrorFactory.conflict('Assessment attempt is not active');
      }

      // Validate completion
      const completionValidation = this.validateAssessmentCompletion(attempt as AssessmentAttemptWithRelations);
      if (!completionValidation.isValid) {
        throw ErrorFactory.validation(completionValidation.error);
      }

      // Calculate time spent
      const timeSpentMinutes = this.calculateTimeSpent(attempt.started_at);
      
      // Update attempt status
      const { error: updateError } = await supabase
        .from('assessment_attempts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          time_spent_minutes: timeSpentMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Process with AI
      const aiResult = await this.processAssessmentWithAI(attempt as AssessmentAttemptWithRelations);

      // Update attempt with AI results
      const { error: aiUpdateError } = await supabase
        .from('assessment_attempts')
        .update({
          ai_analysis: aiResult,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId);

      if (aiUpdateError) throw aiUpdateError;

      // Log completion
      await this.logAssessmentEvent('assessment_completed', {
        attempt_id: attemptId,
        user_id: userId,
        assessment_id: attempt.assessment_id,
        time_spent_minutes: timeSpentMinutes,
        ai_score: aiResult.score,
      });

      // Trigger gamification
      await this.triggerGamificationEvent('assessment_complete', userId, {
        assessment_id: attempt.assessment_id,
        score: aiResult.score,
        time_spent: timeSpentMinutes,
      });

      return {
        success: true,
        data: aiResult,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'completeAssessment',
        attemptId,
        userId,
      });
    }
  }

  // Get assessment metrics
  public async getAssessmentMetrics(assessmentId: string): Promise<APIResponse<AssessmentMetrics>> {
    try {
      // Get completion statistics
      const { data: attempts, error } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('status', 'completed');

      if (error) throw error;

      const totalAttempts = attempts.length;
      const completedAttempts = attempts.filter(a => a.status === 'completed').length;
      const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
      
      const averageTimeSpent = attempts.length > 0 
        ? attempts.reduce((sum, a) => sum + (a.time_spent_minutes || 0), 0) / attempts.length 
        : 0;

      const scores = attempts
        .filter(a => a.ai_analysis?.score)
        .map(a => a.ai_analysis.score);
      
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

      const successRate = scores.length > 0 
        ? (scores.filter(score => score >= 70).length / scores.length) * 100 
        : 0;

      return {
        success: true,
        data: {
          completionRate,
          averageTimeSpent,
          difficultyLevel: 'intermediate', // Could be calculated based on success rate
          successRate,
          userSatisfaction: 85, // Could be calculated from user feedback
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'getAssessmentMetrics',
        assessmentId,
      });
    }
  }

  // Private helper methods
  private validateAssessmentCreation(data: AssessmentCreate): { isValid: boolean; error?: string } {
    if (!data.title || data.title.length < 3) {
      return { isValid: false, error: 'Assessment title must be at least 3 characters' };
    }

    if (!data.questions || data.questions.length < 1) {
      return { isValid: false, error: 'Assessment must have at least one question' };
    }

    if (data.time_limit_minutes < 1 || data.time_limit_minutes > 120) {
      return { isValid: false, error: 'Time limit must be between 1 and 120 minutes' };
    }

    return { isValid: true };
  }

  private validateResponse(response: unknown): { isValid: boolean; error?: string } {
    if (response === null || response === undefined) {
      return { isValid: false, error: 'Response cannot be empty' };
    }

    if (typeof response === 'string' && response.trim().length === 0) {
      return { isValid: false, error: 'Text response cannot be empty' };
    }

    return { isValid: true };
  }

  private validateAssessmentCompletion(attempt: AssessmentAttemptWithRelations): { isValid: boolean; error?: string } {
    const responses = (attempt.raw_responses as Record<string, unknown>) || {};
    const requiredQuestions = attempt.assessments?.questions?.filter((q) => q.required) || [];
    
    const completedRequired = requiredQuestions.every((q) => responses[q.id]);
    
    if (!completedRequired) {
      return { isValid: false, error: 'All required questions must be answered' };
    }

    return { isValid: true };
  }

  private async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    // Implement permission checking logic
    // For now, return true for all users
    return true;
  }

  private async getUserAttemptCount(assessmentId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('assessment_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  private async getActiveAttempt(assessmentId: string, userId: string): Promise<Database['public']['Tables']['assessment_attempts']['Row'] | null> {
    const { data, error } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  private calculateResponseTime(startedAt: string): number {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 1000);
  }

  private calculateTimeSpent(startedAt: string): number {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    return Math.floor((now - start) / (1000 * 60)); // Convert to minutes
  }

  private async processAssessmentWithAI(attempt: AssessmentAttemptWithRelations): Promise<AIAnalysisResult> {
    try {
      // Call the real AI assessment processor Edge Function
      const { data, error } = await supabase.functions.invoke<{success: boolean; error?: string; result: AIAnalysisResult}>('ai-assessment-processor', {
        body: {
          assessment_id: attempt.assessment_id,
          user_id: attempt.user_id,
          responses: attempt.raw_responses,
          time_spent_minutes: attempt.time_spent_minutes,
          attempt_id: attempt.id,
          attempt_number: attempt.attempt_number,
        }
      });

      if (error) {
        throw new Error(`AI assessment processing failed: ${error.message}`);
      }

      if (!data.success || !data.result) {
        throw new Error(data.error || 'AI assessment processing failed');
      }

      // Return the processed AI result
      return {
        score: data.result.score || 0,
        feedback: data.result.feedback || "Your assessment has been analyzed successfully.",
        explanation: data.result.explanation || "Based on your responses, here are the key insights...",
        insights: data.result.insights || [],
        recommendations: data.result.recommendations || [],
        strengths: data.result.strengths || [],
        areas_for_improvement: data.result.areas_for_improvement || [],
        personality_traits: data.result.personality_traits,
        emotional_patterns: data.result.emotional_patterns,
        communication_style: data.result.communication_style,
        leadership_potential: data.result.leadership_potential,
      };
    } catch (error) {
      console.error('AI assessment processing error:', error);
      
      // Return a fallback result with error information
      return {
        score: 0,
        feedback: "Assessment analysis is temporarily unavailable. Please try again later.",
        explanation: "We encountered an issue processing your assessment responses.",
        insights: ["Assessment processing error occurred"],
        recommendations: ["Please retry the assessment"],
        strengths: [],
        areas_for_improvement: [],
      };
    }
  }

  private async logAssessmentEvent(eventType: string, data: Json): Promise<void> {
    try {
      await supabase
        .from('assessment_events')
        .insert({
          event_type: eventType,
          data,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log assessment event:', error);
    }
  }

  private async triggerGamificationEvent(eventType: string, userId: string, metadata: Json): Promise<void> {
    try {
      await supabase.functions.invoke('gamification-engine', {
        body: {
          event_type: eventType,
          user_id: userId,
          metadata,
        },
      });
    } catch (error) {
      console.error('Failed to trigger gamification event:', error);
    }
  }
}

// Export singleton instance
export const assessmentBusinessLogic = AssessmentBusinessLogic.getInstance();
