import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AIConfiguration, Assessment, AIProcessingResult } from "@/types/assessment-types";

type AssessmentFilters = {
  category?: string;
  difficulty?: string;
  is_public?: boolean;
};

export class AIAssessmentService {
  // ... (existing methods)

  /**
   * Get AI configuration for a specific service (e.g., 'assessment_scoring')
   */
  async getAIConfigForService(serviceName: string): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_config_for_service', {
        p_service_type: serviceName
      });

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error(`Error fetching AI config for service ${serviceName}:`, error);
      return null;
    }
  }

  /**
   * Get the active AI configuration for a given use case
   */
  async getActiveAIConfiguration(useCase: string): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from("ai_configurations")
        .select(`
          *,
          prompts (id, name),
          models (id, model_id, display_name),
          providers (id, name),
          ai_behaviors (id, name),
          ai_use_cases (id, name)
        `)
        .eq("ai_use_cases.name", useCase)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error(`Error fetching active AI configuration for ${useCase}:`, error);
      return null;
    }
  }

  // ... (other methods)

  /**
   * Get all public assessments
   */
  async getPublicAssessments(filters?: AssessmentFilters): Promise<Assessment[]> {
    try {
      let query = supabase
        .from("assessments")
        .select("*")
        .eq("is_public", true);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.difficulty) {
        query = query.eq("difficulty_level", filters.difficulty);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as Assessment[]) || [];
    } catch (error) {
      console.error("Error fetching public assessments:", error);
      return [];
    }
  }

  /**
   * Process an assessment with AI using a Supabase Edge Function
   */
  async processAssessmentWithAI(assessmentId: string, answers: Record<string, any>): Promise<AIProcessingResult> {
    try {
      console.log(`Processing assessment ${assessmentId} with AI. Answers:`, answers);
      
      const { data, error } = await supabase.functions.invoke('process-assessment', {
        body: { assessmentId, answers },
      });

      if (error) throw error;

      return data as AIProcessingResult;
    } catch (error) {
      console.error("Error processing assessment with AI:", error);
      return {
        score: 0,
        feedback: "An error occurred while processing your assessment. Please try again later.",
        is_passing: false,
      };
    }
  }
}

export const aiAssessmentService = new AIAssessmentService();