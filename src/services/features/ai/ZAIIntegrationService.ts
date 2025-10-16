import { supabase } from '@/integrations/supabase/client';

export interface ZAIConfig {
  baseUrl: string;
  authToken: string;
  questionsModel: string;
  resultsModel: string;
}

export interface AIOperationRequest {
  type: string;
  payload: Record<string, unknown>;
}

export interface AIOperationResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

/**
 * Z.AI Integration Service
 * Handles all AI operations through Supabase edge functions
 * Uses GLM-4.5-Air for question generation and GLM-4.6 for result analysis
 */
export class ZAIIntegrationService {
  private static readonly EDGE_FUNCTION_URLS = {
    couplesChallenge: 'couples-challenge-ai-zai',
    assessment: 'ai-assessment-zai',
    generic: 'ai-provider-proxy',
  };

  /**
   * Call Z.AI couples challenge function
   */
  static async processCouplesChallenge(
    operation: AIOperationRequest
  ): Promise<AIOperationResponse> {
    try {
      const { data, error } = await supabase.functions.invoke(
        this.EDGE_FUNCTION_URLS.couplesChallenge,
        {
          body: operation,
        }
      );

      if (error) throw error;

      return {
        success: true,
        data,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Call Z.AI assessment function
   */
  static async processAssessment(
    assessmentData: Record<string, unknown>
  ): Promise<AIOperationResponse> {
    try {
      const { data, error } = await supabase.functions.invoke(
        this.EDGE_FUNCTION_URLS.assessment,
        {
          body: assessmentData,
        }
      );

      if (error) throw error;

      return {
        success: true,
        data,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Generate dynamic question using GLM-4.5-Air
   */
  static async generateDynamicQuestion(previousResponses: Record<string, unknown>, context: string): Promise<AIOperationResponse> {
    return this.processCouplesChallenge({
      type: 'generateDynamicQuestion',
      payload: {
        previousResponses,
        currentContext: context,
        challengeProgress: 0,
      },
    });
  }

  /**
   * Analyze partner qualities
   */
  static async analyzePartnerQualities(
    userQualities: Record<string, unknown>,
    partnerQualities: Record<string, unknown>
  ): Promise<AIOperationResponse> {
    return this.processCouplesChallenge({
      type: 'analyzePartnerQualities',
      payload: { userQualities, partnerQualities },
    });
  }

  /**
   * Score assessment using GLM-4.6
   */
  static async scoreAssessment(
    assessmentId: string,
    userId: string,
    responses: Record<string, unknown>
  ): Promise<AIOperationResponse> {
    return this.processAssessment({
      assessment_id: assessmentId,
      user_id: userId,
      responses,
    });
  }

  /**
   * Get Z.AI configuration from database
   */
  static async getZAIConfig(): Promise<ZAIConfig | null> {
    try {
      const { data, error } = await supabase
        .from('zai_integration_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      return {
        baseUrl: data.base_url,
        authToken: data.auth_token,
        questionsModel: data.questions_model,
        resultsModel: data.results_model,
      };
    } catch (error) {
      console.error('Failed to fetch Z.AI config:', error);
      return null;
    }
  }

  /**
   * Test Z.AI connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const config = await this.getZAIConfig();
      if (!config) return false;

      const response = await fetch(`${config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Z.AI connection test failed:', error);
      return false;
    }
  }
}

export default ZAIIntegrationService;
