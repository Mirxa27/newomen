import { supabase } from "@/integrations/supabase/client";
import {
  Assessment,
  AssessmentInsert,
  AssessmentUpdate,
  AssessmentAttempt,
  AssessmentFilters,
  asAssessments,
  asAssessment
} from "@/types/features/assessment/assessment-optimized";
import type { Json } from "@/integrations/supabase/types";

/**
 * Optimized Assessment Service with pre-typed query builders
 * Prevents TypeScript from complex type inference during compilation
 */
export class AssessmentServiceOptimized {
  private readonly assessmentsTable = "assessments_enhanced";
  private readonly attemptsTable = "assessment_attempts";

  /**
   * Get assessments with type-safe query builder
   */
  async getAssessments(filters?: AssessmentFilters): Promise<Assessment[]> {
    try {
      // Use Supabase's query builder directly and let TypeScript infer the type
      const query = supabase
        .from(this.assessmentsTable)
        .select("id, title, type, category, description, status, is_public, difficulty_level, time_limit_minutes, max_attempts, created_at, updated_at, questions, scoring_logic, outcome_descriptions");

      // Apply filters
      let filteredQuery = query;
      if (filters?.is_public !== undefined) {
        filteredQuery = query.eq("is_public", filters.is_public);
      }
      if (filters?.category) {
        filteredQuery = query.eq("category", filters.category);
      }
      if (filters?.type) {
        filteredQuery = query.eq("type", filters.type);
      }
      if (filters?.status) {
        filteredQuery = query.eq("status", filters.status);
      }

      const { data, error } = await filteredQuery;

      if (error) {
        console.error("Error fetching assessments:", error);
        return [];
      }

      return data ? asAssessments(data) : [];
    } catch (error) {
      console.error("Unexpected error in getAssessments:", error);
      return [];
    }
  }

  /**
   * Get assessment by ID with caching strategy
   */
  async getAssessmentById(id: string): Promise<Assessment | null> {
    try {
      const { data, error } = await supabase
        .from(this.assessmentsTable)
        .select(`
          id,
          title,
          type,
          category,
          description,
          status,
          is_public,
          difficulty_level,
          time_limit_minutes,
          max_attempts,
          created_at,
          updated_at,
          questions,
          scoring_logic,
          outcome_descriptions
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error(`Error fetching assessment ${id}:`, error);
        return null;
      }

      return data ? asAssessment(data) : null;
    } catch (error) {
      console.error(`Unexpected error fetching assessment ${id}:`, error);
      return null;
    }
  }

  /**
   * Get public assessments with optimized query
   */
  async getPublicAssessments(filters?: Omit<AssessmentFilters, 'is_public'>): Promise<Assessment[]> {
    return this.getAssessments({ ...filters, is_public: true });
  }

  /**
   * Create assessment with type safety
   */
  async createAssessment(assessment: AssessmentInsert): Promise<Assessment | null> {
    try {
      const { data, error } = await supabase
        .from(this.assessmentsTable)
        .insert(assessment)
        .select()
        .single();

      if (error) {
        console.error("Error creating assessment:", error);
        return null;
      }

      return data ? asAssessment(data) : null;
    } catch (error) {
      console.error("Unexpected error creating assessment:", error);
      return null;
    }
  }

  /**
   * Update assessment with partial updates
   */
  async updateAssessment(id: string, updates: AssessmentUpdate): Promise<Assessment | null> {
    try {
      const { data, error } = await supabase
        .from(this.assessmentsTable)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating assessment ${id}:`, error);
        return null;
      }

      return data ? asAssessment(data) : null;
    } catch (error) {
      console.error(`Unexpected error updating assessment ${id}:`, error);
      return null;
    }
  }

  /**
   * Get assessment attempts with pagination
   */
  async getAssessmentAttempts(
    assessmentId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'score';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<AssessmentAttempt[]> {
    try {
      let query = supabase
        .from(this.attemptsTable)
        .select("*")
        .eq("assessment_id", assessmentId);

      // Apply ordering
      const orderBy = options?.orderBy || 'created_at';
      const orderDirection = options?.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching assessment attempts:", error);
        return [];
      }

      return (data || []) as AssessmentAttempt[];
    } catch (error) {
      console.error("Unexpected error fetching assessment attempts:", error);
      return [];
    }
  }

  /**
   * Submit assessment attempt
   */
  async submitAttempt(
    assessmentId: string,
    userId: string,
    answers: Record<string, unknown>
  ): Promise<AssessmentAttempt | null> {
    try {
      const attempt = {
        assessment_id: assessmentId,
        user_id: userId,
        raw_responses: answers as Json, // Use raw_responses for JSON
        attempt_number: 1, // Default to 1, or fetch next number
        status: 'in_progress',
        started_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.attemptsTable)
        .insert(attempt)
        .select()
        .single();

      if (error) {
        console.error("Error submitting assessment attempt:", error);
        return null;
      }

      return data as AssessmentAttempt;
    } catch (error) {
      console.error("Unexpected error submitting assessment attempt:", error);
      return null;
    }
  }

  /**
   * Complete assessment attempt
   */
  async completeAttempt(
    attemptId: string,
    score: number,
    feedback?: string
  ): Promise<AssessmentAttempt | null> {
    try {
      const { data, error } = await supabase
        .from(this.attemptsTable)
        .update({
          ai_score: score, // Use ai_score for number score
          ai_feedback: feedback, // Use ai_feedback for string feedback
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq("id", attemptId)
        .select()
        .single();

      if (error) {
        console.error("Error completing assessment attempt:", error);
        return null;
      }

      return data as AssessmentAttempt;
    } catch (error) {
      console.error("Unexpected error completing assessment attempt:", error);
      return null;
    }
  }

  /**
   * Batch operations for performance
   */
  async batchGetAssessments(ids: string[]): Promise<Assessment[]> {
    if (ids.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from(this.assessmentsTable)
        .select("id, title, type, category, description, status, is_public, created_at, updated_at")
        .in("id", ids);

      if (error) {
        console.error("Error batch fetching assessments:", error);
        return [];
      }

      return data ? asAssessments(data) : [];
    } catch (error) {
      console.error("Unexpected error in batchGetAssessments:", error);
      return [];
    }
  }
}

// Export singleton instance
export const assessmentServiceOptimized = new AssessmentServiceOptimized();
