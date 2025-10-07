import { configService } from './configService';
import * as providers from './providers';
import type { AIConfiguration, AIResponse } from './aiTypes';
import type { AssessmentSubmission, QuizSubmission, ChallengeSubmission } from '@/types/ai-types';
import { supabase } from '@/integrations/supabase/client';

class AIService {
  public configService = configService;
  private rateLimitMap: Map<string, number[]> = new Map();
  private cache: Map<string, { data: AIResponse; timestamp: number }> = new Map();

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    const userRequests = this.rateLimitMap.get(userId) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    if (recentRequests.length >= 10) return false;
    recentRequests.push(now);
    this.rateLimitMap.set(userId, recentRequests);
    return true;
  }

  async callAIProvider(config: AIConfiguration, prompt: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      switch (config.provider) {
        case 'openai':
          return await providers.callOpenAI(config, prompt, startTime);
        case 'anthropic':
          return await providers.callAnthropic(config, prompt, startTime);
        case 'google':
          return await providers.callGoogle(config, prompt, startTime);
        case 'azure':
        case 'custom':
        case 'elevenlabs':
        case 'cartesia':
        case 'deepgram':
        case 'hume':
          return await providers.callCustomProvider(config, prompt, startTime);
        default:
          throw new Error(`Unsupported AI provider: ${config.provider}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI provider call failed',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  async generateAssessmentResult(submission: AssessmentSubmission, configId?: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const config = configId
        ? this.configService.getConfiguration(configId)
        : await this.configService.getConfigurationForService('assessment_scoring', submission.assessment_id);
      if (!config) throw new Error('No suitable AI configuration found');
      if (!this.checkRateLimit(submission.user_id)) throw new Error('Rate limit exceeded.');

      const prompt = await this.buildAssessmentPrompt(submission);
      return await this.callAIProvider(config, prompt);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', processing_time_ms: Date.now() - startTime };
    }
  }

  private async buildAssessmentPrompt(submission: AssessmentSubmission): Promise<string> {
    const { data: assessment } = await supabase
      .from('assessments_enhanced')
      .select('*')
      .eq('id', submission.assessment_id)
      .single();
    if (!assessment) throw new Error('Assessment not found');
    return `Analyze these assessment responses:\nAssessment: ${assessment.title}\nResponses: ${JSON.stringify(submission.answers, null, 2)}\n\nProvide a JSON response with score, traits, strengths, and improvements.`;
  }
  
  // Placeholder for other high-level methods
  async generateQuizResult(submission: QuizSubmission): Promise<AIResponse> {
    return { success: false, error: 'Not implemented', processing_time_ms: 0 };
  }

  async generateChallengeFeedback(submission: ChallengeSubmission): Promise<AIResponse> {
    return { success: false, error: 'Not implemented', processing_time_ms: 0 };
  }
}

export const aiService = new AIService();