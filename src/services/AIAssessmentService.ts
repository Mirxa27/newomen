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
  api_base_url: string;
  api_version: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_prompt: string;
  user_prompt_template: string;
  custom_headers: Record<string, string>;
  is_default: boolean;
  provider_name: string;
  cost_per_1k_prompt_tokens: number;
  cost_per_1k_completion_tokens: number;
}

export class AIAssessmentService {
  /**
   * Get AI configuration for a specific service (e.g., 'assessment_scoring')
   */
  async getAIConfigForService(serviceName: string): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_config_for_service', {
        service_type_param: serviceName,
        service_id_param: null
      });

      if (error) throw error;
      
      // The RPC returns an array, even for a single expected result
      const configData = data as unknown as GetAIConfigForServiceResponse[];
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
        api_base_url: result.api_base_url,
        api_version: result.api_version,
        topP: result.top_p,
        frequencyPenalty: result.frequency_penalty,
        presencePenalty: result.presence_penalty,
        isDefault: result.is_default,
        custom_headers: result.custom_headers,
        cost_per_1k_input_tokens: result.cost_per_1k_prompt_tokens,
        cost_per_1k_output_tokens: result.cost_per_1k_completion_tokens,
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
      
      // Type-safe extraction of properties
      const attemptId = 'attempt_id' in answers ? answers.attempt_id : 
                       'attemptId' in answers ? answers.attemptId : null;
      const userId = 'user_id' in answers ? answers.user_id : 
                    'userId' in answers ? answers.userId : null;
      const responses = 'responses' in answers ? answers.responses : answers;
      const timeSpentMinutes = 'time_spent_minutes' in answers ? answers.time_spent_minutes :
                              'timeSpentMinutes' in answers ? answers.timeSpentMinutes : 0;
      
      const payload = {
        attemptId: attemptId as string,
        assessmentId,
        userId: userId as string,
        responses: responses as Record<string, unknown>,
        timeSpentMinutes: Number(timeSpentMinutes) || 0,
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
        const analysis = data.analysis;
        
        // Handle different AI response formats
        const feedback = analysis.feedback || analysis.overall_assessment || '';
        const explanation = analysis.explanation || (typeof analysis.insights === 'string' ? analysis.insights : '') || analysis.next_steps || '';
        const insights = Array.isArray(analysis.insights) ? analysis.insights : 
                        (analysis.detailed_insights ? [analysis.detailed_insights] : []);
        const strengths = analysis.strengths || [];
        const areas_for_improvement = analysis.areas_for_improvement || analysis.areas_for_reflection || [];
        const recommendations = analysis.recommendations || [];
        
        return {
          score: analysis.score || 0,
          feedback,
          explanation,
          insights,
          recommendations,
          strengths,
          areas_for_improvement,
          is_passing: analysis.passed || (analysis.score || 0) >= 70,
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
