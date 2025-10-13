import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface PartnerQualityData {
  userId: string;
  partnerName: string;
  desiredQualities: string[];
  relationshipGoals: string;
  communicationStyle: string;
  values: string[];
}

export interface PsychologicalPerspective {
  attachmentStyle: string;
  loveLanguage: string;
  conflictResolution: string;
  emotionalNeeds: string[];
  growthAreas: string[];
}

export interface AIQuestionGeneration {
  question: string;
  context: string;
  psychologicalIntent: string;
  expectedInsight: string;
}

export interface AICouplesAnalysis {
  compatibilityScore: number;
  strengths: string[];
  growthOpportunities: string[];
  communicationPatterns: string[];
  psychologicalInsights: PsychologicalPerspective;
  nextSteps: string[];
  conversationStarters: string[];
}

export class AICouplesChallengeService {
  private static instance: AICouplesChallengeService;
  private zaiApiKey: string | null = null;
  private zaiBaseUrl = 'https://api.z.ai/api/coding/paas/v4';
  private zaiModel = 'GLM-4.6';

  private constructor() {}

  static getInstance(): AICouplesChallengeService {
    if (!AICouplesChallengeService.instance) {
      AICouplesChallengeService.instance = new AICouplesChallengeService();
    }
    return AICouplesChallengeService.instance;
  }

  private async getZaiApiKey(): Promise<string> {
    if (this.zaiApiKey) return this.zaiApiKey;

    try {
      const { data, error } = await supabase.rpc('get_provider_api_key_by_type', { 
        p_provider_type: 'zai' 
      });

      if (error) throw error;
      if (!data) throw new Error('Z.AI API key not configured');

      this.zaiApiKey = data;
      return this.zaiApiKey;
    } catch (err) {
      console.error('Error retrieving Z.AI API key:', err);
      throw new Error(`Z.AI API key retrieval failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async generateDynamicQuestion(
    previousResponses: Array<{ question: string; userResponse: string; partnerResponse: string }>,
    currentContext: string,
    challengeProgress: number
  ): Promise<AIQuestionGeneration> {
    const apiKey = await this.getZaiApiKey();

