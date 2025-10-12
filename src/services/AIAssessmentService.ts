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
      
      const payload = {
        attemptId: (answers as any).attempt_id ?? (answers as any).attemptId,
        assessmentId,
        userId: (answers as any).user_id ?? (answers as any).userId,
        responses: (answers as any).responses ?? answers,
        timeSpentMinutes: (answers as any).time_spent_minutes ?? (answers as any).timeSpentMinutes ?? 0,
      };

      const { data, error } = await supabase.functions.invoke('ai-assessment-processor', {
        body: payload,
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }

      console.log('AI processing response:', data);

      // Handle the response structure from the Edge Function
      if (data && data.success && data.analysis) {
        return {
          score: data.analysis.score || 0,
          feedback: data.analysis.feedback || '',
          explanation: data.analysis.explanation || '',
          insights: data.analysis.insights || [],
          recommendations: data.analysis.recommendations || [],
          strengths: data.analysis.strengths || [],
          areas_for_improvement: data.analysis.areas_for_improvement || [],
          is_passing: (data.analysis.score || 0) >= 70,
          tokensUsed: data.tokensUsed,
          cost: data.cost,
        } as AIProcessingResult;
      }

      return data as AIProcessingResult;
    } catch (error) {
      console.error("Error processing assessment with AI:", error);
      
      // Provide more helpful error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Detailed error:", errorMessage);
      
      // Check if it's a network/function error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('FunctionsHttpError')) {
        return {
          score: 0,
          feedback: "Unable to connect to AI processing service. Your answers have been saved. Please check your internet connection and try again, or contact support if the issue persists.",
          is_passing: false,
          error: 'CONNECTION_ERROR'
        };
      }
      
      return {
        score: 0,
        feedback: "An error occurred while processing your assessment. Your responses have been saved. Please try again later or contact support if the issue persists.",
        is_passing: false,
        error: errorMessage
      };
    }
  }
}

export const aiAssessmentService = new AIAssessmentService();