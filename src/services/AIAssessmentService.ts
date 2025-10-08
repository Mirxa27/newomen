import { supabase } from "@/integrations/supabase/client";
import {
  Assessment,
  AIProcessingResult,
  asAssessments,
} from "@/types/assessment-optimized";
import type { AIConfiguration } from "@/services/ai/aiTypes";

type AssessmentFilters = {
  category?: string;
  difficulty?: string;
  is_public?: boolean;
};

// Interface for the data returned by the get_ai_config_for_service RPC
interface GetAIConfigForServiceResponse {
  config_id: string;
  config_name: string;
  provider: AIConfiguration['provider'];
  model_name: string;
  api_base_url: string | null;
  api_version: string | null;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_prompt: string | null;
  user_prompt_template: string | null;
  custom_headers: Record<string, string> | null;
  is_default: boolean;
  provider_name: string | null;
  cost_per_1k_input_tokens: number | null;
  cost_per_1k_output_tokens: number | null;
}

export class AIAssessmentService {
  /**
   * Get AI configuration for a specific service (e.g., 'assessment_scoring')
   */
  async getAIConfigForService(serviceName: string): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_config_for_service', {
        p_service_type: serviceName
      });

      if (error) throw error;
      
      // The RPC returns an array, even for a single expected result
      const configData = data as GetAIConfigForServiceResponse[];
      if (!configData || configData.length === 0) return null;

      const result = configData[0];
      
      // Map the RPC response to our AIConfiguration interface
      return {
        id: result.config_id,
        name: result.config_name,
        provider: result.provider,
        model: result.model_name,
        apiKey: '', // API key is handled server-side or in a secure client context
        temperature: result.temperature,
        maxTokens: result.max_tokens,
        systemPrompt: result.system_prompt || undefined,
        api_base_url: result.api_base_url || undefined,
        api_version: result.api_version || undefined,
        topP: result.top_p,
        frequencyPenalty: result.frequency_penalty,
        presencePenalty: result.presence_penalty,
        isDefault: result.is_default,
        custom_headers: result.custom_headers || undefined,
        cost_per_1k_input_tokens: result.cost_per_1k_input_tokens || undefined,
        cost_per_1k_output_tokens: result.cost_per_1k_output_tokens || undefined,
      };
    } catch (error) {
      console.error(`Error fetching AI config for service ${serviceName}:`, error);
      return null;
    }
  }

  /**
   * Get all member-only assessments
   */
  async getMemberAssessments(filters?: Omit<AssessmentFilters, 'is_public'>): Promise<Assessment[]> {
    try {
      let query = supabase
        .from("assessments_enhanced")
        .select("*")
        .eq("is_public", false)
        .eq("is_active", true);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.difficulty) {
        query = query.eq("difficulty_level", filters.difficulty);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data ? asAssessments(data) : [];
    } catch (error) {
      console.error("Error fetching member assessments:", error);
      return [];
    }
  }

  /**
   * Process an assessment with AI using a Supabase Edge Function
   */
  async processAssessmentWithAI(assessmentId: string, answers: Record<string, unknown>): Promise<AIProcessingResult> {
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