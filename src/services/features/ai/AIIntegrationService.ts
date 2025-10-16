// AI Integration Service
// Connects the unified AI management system with existing app features

import { supabase } from '@/integrations/supabase/client';
import { aiProviderManager } from './AIProviderManager';
import type { AIProvider, AIModel, AIVoice } from './providers/types';
import { Json } from '@/integrations/supabase/types';

export interface FeatureAIConfig {
  feature: 'assessment' | 'couples' | 'wellness' | 'newme' | 'community';
  modelId: string;
  voiceId?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  lastUpdated: string;
}

export interface AIIntegrationResult<T = Json> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    tokens: number;
    cost: number;
    latency: number;
  };
}

export class AIIntegrationService {
  private static instance: AIIntegrationService;

  private constructor() {}

  static getInstance(): AIIntegrationService {
    if (!AIIntegrationService.instance) {
      AIIntegrationService.instance = new AIIntegrationService();
    }
    return AIIntegrationService.instance;
  }

  // Get AI configuration for a specific feature
  async getFeatureConfig(feature: FeatureAIConfig['feature']): Promise<FeatureAIConfig | null> {
    try {
      const { data, error } = await supabase
        .from('ai_feature_configs')
        .select('*')
        .eq('feature', feature)
        .eq('enabled', true)
        .single();

      if (error || !data) {
        console.warn(`No AI config found for feature: ${feature}`);
        return null;
      }

      return data as FeatureAIConfig;
    } catch (error) {
      console.error(`Failed to get AI config for ${feature}:`, error);
      return null;
    }
  }

  // Update AI configuration for a feature
  async updateFeatureConfig(config: FeatureAIConfig): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_feature_configs')
        .upsert({
          ...config,
          lastUpdated: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to update feature config:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update feature config:', error);
      return false;
    }
  }

  // Assessment AI Integration
  async generateAssessmentFeedback(
    assessmentId: string,
    responses: Record<string, unknown>,
    scores: Record<string, number>
  ): Promise<AIIntegrationResult<{ feedback: string | undefined; generatedAt: string }>> {
    try {
      const config = await this.getFeatureConfig('assessment');
      if (!config) {
        return {
          success: false,
          error: 'No AI configuration found for assessment feature'
        };
      }

      const prompt = `${config.systemPrompt}

Assessment Responses: ${JSON.stringify(responses)}
Scores: ${JSON.stringify(scores)}

Please provide personalized feedback based on these assessment results.`;

      const response = await aiProviderManager.testModel(
        config.modelId,
        prompt,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            feedback: response.data?.content,
            generatedAt: new Date().toISOString()
          },
          usage: {
            tokens: response.data?.usage?.totalTokens || 0,
            cost: response.data?.cost || 0,
            latency: 0 // Would need to track this separately
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to generate feedback'
        };
      }
    } catch (error) {
      console.error('Assessment AI integration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Couples Challenge AI Integration
  async generateCouplesAnalysis(
    partnerData: Record<string, unknown>,
    responses: unknown[]
  ): Promise<AIIntegrationResult<{ analysis: string | undefined; generatedAt: string }>> {
    try {
      const config = await this.getFeatureConfig('couples');
      if (!config) {
        return {
          success: false,
          error: 'No AI configuration found for couples feature'
        };
      }

      const prompt = `${config.systemPrompt}

Partner Data: ${JSON.stringify(partnerData)}
Challenge Responses: ${JSON.stringify(responses)}

Please analyze this couples challenge data and provide insights.`;

      const response = await aiProviderManager.testModel(
        config.modelId,
        prompt,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            analysis: response.data?.content,
            generatedAt: new Date().toISOString()
          },
          usage: {
            tokens: response.data?.usage?.totalTokens || 0,
            cost: response.data?.cost || 0,
            latency: 0
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to generate couples analysis'
        };
      }
    } catch (error) {
      console.error('Couples AI integration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Wellness AI Integration
  async generateWellnessInsights(
    wellnessData: Record<string, unknown>,
    goals: string[]
  ): Promise<AIIntegrationResult<{ insights: string | undefined; generatedAt: string }>> {
    try {
      const config = await this.getFeatureConfig('wellness');
      if (!config) {
        return {
          success: false,
          error: 'No AI configuration found for wellness feature'
        };
      }

      const prompt = `${config.systemPrompt}

Wellness Data: ${JSON.stringify(wellnessData)}
Goals: ${goals.join(', ')}

Please provide personalized wellness insights and recommendations.`;

      const response = await aiProviderManager.testModel(
        config.modelId,
        prompt,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            insights: response.data?.content,
            generatedAt: new Date().toISOString()
          },
          usage: {
            tokens: response.data?.usage?.totalTokens || 0,
            cost: response.data?.cost || 0,
            latency: 0
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to generate wellness insights'
        };
      }
    } catch (error) {
      console.error('Wellness AI integration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // NewMe Voice Agent Integration
  async generateVoiceResponse(
    userMessage: string,
    context: Record<string, unknown>
  ): Promise<AIIntegrationResult<{ text: string | undefined; audioUrl: string | undefined; generatedAt: string }>> {
    try {
      const config = await this.getFeatureConfig('newme');
      if (!config) {
        return {
          success: false,
          error: 'No AI configuration found for NewMe feature'
        };
      }

      const prompt = `${config.systemPrompt}

User Message: ${userMessage}
Context: ${JSON.stringify(context)}

Please respond as the NewMe voice agent.`;

      const response = await aiProviderManager.testModel(
        config.modelId,
        prompt,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      );

      if (response.success && response.data) {
        // If voice is configured, generate audio
        let audioUrl: string | undefined;
        if (config.voiceId) {
          try {
            const voiceResponse = await aiProviderManager.testVoice(
              config.voiceId,
              response.data.content,
              {
                stability: 0.5,
                similarityBoost: 0.5
              }
            );

            if (voiceResponse.success && voiceResponse.data?.audioUrl) {
              audioUrl = voiceResponse.data.audioUrl;
            }
          } catch (voiceError) {
            console.warn('Voice generation failed:', voiceError);
          }
        }

        return {
          success: true,
          data: {
            text: response.data?.content,
            audioUrl,
            generatedAt: new Date().toISOString()
          },
          usage: {
            tokens: response.data?.usage?.totalTokens || 0,
            cost: response.data?.cost || 0,
            latency: 0
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to generate voice response'
        };
      }
    } catch (error) {
      console.error('NewMe AI integration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Community AI Integration
  async generateCommunityContent(
    topic: string,
    context: Record<string, unknown>
  ): Promise<AIIntegrationResult<{ content: string | undefined; generatedAt: string }>> {
    try {
      const config = await this.getFeatureConfig('community');
      if (!config) {
        return {
          success: false,
          error: 'No AI configuration found for community feature'
        };
      }

      const prompt = `${config.systemPrompt}

Topic: ${topic}
Context: ${JSON.stringify(context)}

Please generate engaging community content.`;

      const response = await aiProviderManager.testModel(
        config.modelId,
        prompt,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            content: response.data?.content,
            generatedAt: new Date().toISOString()
          },
          usage: {
            tokens: response.data?.usage?.totalTokens || 0,
            cost: response.data?.cost || 0,
            latency: 0
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to generate community content'
        };
      }
    } catch (error) {
      console.error('Community AI integration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get available models for a feature
  async getAvailableModels(feature: FeatureAIConfig['feature']): Promise<AIModel[]> {
    try {
      const models = await aiProviderManager.getModels();
      return models.filter(m => m.enabled);
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  // Get available voices for a feature
  async getAvailableVoices(feature: FeatureAIConfig['feature']): Promise<AIVoice[]> {
    try {
      const voices = await aiProviderManager.getVoices();
      return voices.filter(v => v.enabled);
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  // Test feature AI configuration
  async testFeatureConfig(feature: FeatureAIConfig['feature']): Promise<AIIntegrationResult<{ message: string; testResponse: string | undefined }>> {
    try {
      const config = await this.getFeatureConfig(feature);
      if (!config) {
        return {
          success: false,
          error: `No configuration found for ${feature} feature`
        };
      }

      const testPrompt = `Test prompt for ${feature} feature. Please respond with a brief confirmation.`;
      
      const response = await aiProviderManager.testModel(
        config.modelId,
        testPrompt,
        {
          temperature: config.temperature,
          maxTokens: 100
        }
      );

      if (response.success) {
        return {
          success: true,
          data: {
            message: `AI configuration for ${feature} is working correctly`,
            testResponse: response.data?.content
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Test failed'
        };
      }
    } catch (error) {
      console.error(`Failed to test ${feature} configuration:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const aiIntegrationService = AIIntegrationService.getInstance();