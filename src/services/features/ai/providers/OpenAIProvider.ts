// OpenAI Provider Service
// Implementation for OpenAI API integration with auto-discovery

import { 
  AIModel, 
  AIVoice, 
  ModelListResponse, 
  VoiceListResponse, 
  ProviderTestResult, 
  ModelCapabilities,
  OpenAIConfig,
  AIProvider,
  ProviderAuth,
  ProviderEndpoints,
} from './types';
import { BaseProviderService } from './BaseProviderService';

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenAIModelResponse {
  object: string;
  data: OpenAIModel[];
}

interface OpenAIVoice {
  voice_id: string;
  name: string;
  description?: string;
  preview_url?: string;
}

export class OpenAIProviderService extends BaseProviderService {
  private config: OpenAIConfig;

  constructor(provider: AIProvider, auth: ProviderAuth, endpoints: ProviderEndpoints, config: OpenAIConfig) {
    super(provider, auth, endpoints);
    this.config = config;
  }

  async discoverModels(): Promise<ModelListResponse> {
    try {
      const url = this.buildUrl(this.endpoints.models || '/v1/models');
      const response = await this.makeRequest<OpenAIModelResponse>(url);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch models from OpenAI');
      }

      const models: AIModel[] = response.data.data
        .filter(model => this.isValidModel(model))
        .map(model => this.transformOpenAIModel(model));

      return {
        models,
        total: models.length
      };

    } catch (error) {
      console.error('OpenAI model discovery failed:', error);
      throw error;
    }
  }

  async discoverVoices(): Promise<VoiceListResponse> {
    // OpenAI doesn't have a voices API like ElevenLabs
    // We'll return the predefined TTS voices
    const predefinedVoices: AIVoice[] = [
      {
        id: `${this.provider.id}-alloy`,
        providerId: this.provider.id,
        voiceId: 'alloy',
        name: 'Alloy',
        description: 'A balanced, natural voice',
        gender: 'neutral',
        locale: 'en-US',
        language: 'en',
        style: ['natural', 'balanced'],
        enabled: true
      },
      {
        id: `${this.provider.id}-echo`,
        providerId: this.provider.id,
        voiceId: 'echo',
        name: 'Echo',
        description: 'A warm, upbeat voice',
        gender: 'neutral',
        locale: 'en-US',
        language: 'en',
        style: ['warm', 'upbeat'],
        enabled: true
      },
      {
        id: `${this.provider.id}-fable`,
        providerId: this.provider.id,
        voiceId: 'fable',
        name: 'Fable',
        description: 'A storytelling voice with character',
        gender: 'neutral',
        locale: 'en-US',
        language: 'en',
        style: ['storytelling', 'expressive'],
        enabled: true
      },
      {
        id: `${this.provider.id}-onyx`,
        providerId: this.provider.id,
        voiceId: 'onyx',
        name: 'Onyx',
        description: 'A deep, authoritative voice',
        gender: 'male',
        locale: 'en-US',
        language: 'en',
        style: ['deep', 'authoritative'],
        enabled: true
      },
      {
        id: `${this.provider.id}-nova`,
        providerId: this.provider.id,
        voiceId: 'nova',
        name: 'Nova',
        description: 'A bright, energetic voice',
        gender: 'female',
        locale: 'en-US',
        language: 'en',
        style: ['bright', 'energetic'],
        enabled: true
      },
      {
        id: `${this.provider.id}-shimmer`,
        providerId: this.provider.id,
        voiceId: 'shimmer',
        name: 'Shimmer',
        description: 'A soft, gentle voice',
        gender: 'female',
        locale: 'en-US',
        language: 'en',
        style: ['soft', 'gentle'],
        enabled: true
      }
    ];

    return {
      voices: predefinedVoices,
      total: predefinedVoices.length
    };
  }

  async testConnection(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    try {
      const url = this.buildUrl(this.endpoints.health || '/v1/models', { limit: '1' });
      const response = await this.makeRequest(url);
      
      const responseTime = Date.now() - startTime;
      
      return {
        providerId: this.provider.id,
        endpoint: url,
        statusCode: response.statusCode,
        responseTime,
        isHealthy: response.success,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = this.parseError(error);

      return {
        providerId: this.provider.id,
        endpoint: this.endpoints.health || '/v1/models',
        responseTime,
        isHealthy: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const tempAuth = { ...this.auth, apiKey };
      const originalAuth = this.auth;
      
      // Temporarily use the new API key
      this.auth = tempAuth;
      
      const testResult = await this.testConnection();
      
      // Restore original auth
      this.auth = originalAuth;
      
      return testResult.isHealthy;

    } catch (error) {
      console.error('OpenAI API key validation failed:', error);
      return false;
    }
  }

  // Helper methods
  private isValidModel(model: OpenAIModel): boolean {
    // Filter out deprecated or non-chat models
    const excludePatterns = [
      /^text-/,           // Old GPT-3 models
      /^code-/,           // Deprecated Codex models
      /^cushman/,         // Old models
      /^ada/,             // Old models
      /^babbage/,         // Old models
      /^curie/,           // Old models
      /^davinci/,         // Old models (except gpt-3.5-turbo variants)
      /^text-embedding/   // Embedding models (handle separately if needed)
    ];

    return !excludePatterns.some(pattern => pattern.test(model.id));
  }

  private transformOpenAIModel(model: OpenAIModel): AIModel {
    const capabilities: ModelCapabilities = {
      chat: this.isChatModel(model.id),
      completion: true,
      streaming: true,
      vision: this.isVisionModel(model.id),
      tools: this.supportsTools(model.id),
      json: this.supportsJson(model.id)
    };

    // Determine context limit based on model
    const contextLimit = this.getContextLimit(model.id);
    
    // Estimate pricing (these are approximate and should be updated with real data)
    const pricing = this.getModelPricing(model.id);

    return {
      id: `${this.provider.id}-${model.id}`,
      providerId: this.provider.id,
      modelId: model.id,
      displayName: this.getDisplayName(model.id),
      description: this.getModelDescription(model.id),
      modality: this.isVisionModel(model.id) ? 'multimodal' : 'text',
      contextLimit,
      inputPricing: pricing.input,
      outputPricing: pricing.output,
      latencyMs: this.getEstimatedLatency(model.id),
      capabilities,
      isRealtime: this.isRealtimeModel(model.id),
      enabled: true
    };
  }

  private isChatModel(modelId: string): boolean {
    return modelId.includes('gpt') || modelId.includes('o1') || modelId.startsWith('chatgpt');
  }

  private isVisionModel(modelId: string): boolean {
    return modelId.includes('vision') || modelId.includes('gpt-4') || modelId.includes('o1');
  }

  private supportsTools(modelId: string): boolean {
    // Most modern OpenAI models support function calling
    return this.isChatModel(modelId) && !modelId.includes('o1'); // o1 models don't support tools yet
  }

  private supportsJson(modelId: string): boolean {
    return this.isChatModel(modelId);
  }

  private isRealtimeModel(modelId: string): boolean {
    return modelId.includes('realtime') || modelId === 'gpt-4o-realtime-preview';
  }

  private getContextLimit(modelId: string): number {
    if (modelId.includes('gpt-4-turbo') || modelId.includes('gpt-4o')) return 128000;
    if (modelId.includes('gpt-4')) return 8192;
    if (modelId.includes('gpt-3.5-turbo-16k')) return 16384;
    if (modelId.includes('gpt-3.5-turbo')) return 4096;
    if (modelId.includes('o1')) return 128000;
    return 4096; // Default
  }

  private getDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      'gpt-4o': 'GPT-4 Omni',
      'gpt-4o-mini': 'GPT-4 Omni Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'o1-preview': 'O1 Preview',
      'o1-mini': 'O1 Mini'
    };

    return displayNames[modelId] || modelId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private getModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gpt-4o': 'Most advanced multimodal model with vision, audio, and text capabilities',
      'gpt-4o-mini': 'Faster, more affordable version of GPT-4 Omni',
      'gpt-4-turbo': 'High-performance model with large context window',
      'gpt-4': 'Flagship model for complex tasks requiring deep understanding',
      'gpt-3.5-turbo': 'Fast and efficient model for most conversational tasks',
      'o1-preview': 'Reasoning model optimized for complex problem-solving',
      'o1-mini': 'Smaller reasoning model for coding and math problems'
    };

    return descriptions[modelId] || `OpenAI ${this.getDisplayName(modelId)} model`;
  }

  private getEstimatedLatency(modelId: string): number {
    // Estimated latencies in milliseconds
    if (modelId.includes('o1')) return 15000; // O1 models are much slower
    if (modelId.includes('gpt-4o-mini')) return 800;
    if (modelId.includes('gpt-4o')) return 1200;
    if (modelId.includes('gpt-4')) return 2000;
    if (modelId.includes('gpt-3.5')) return 600;
    return 1000; // Default
  }

  private getModelPricing(modelId: string) {
    // Pricing per 1M tokens (approximate, should be updated with real data)
    const pricingTable: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 5.00, output: 15.00 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'gpt-4-turbo': { input: 10.00, output: 30.00 },
      'gpt-4': { input: 30.00, output: 60.00 },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
      'o1-preview': { input: 15.00, output: 60.00 },
      'o1-mini': { input: 3.00, output: 12.00 }
    };

    const pricing = pricingTable[modelId] || { input: 1.00, output: 3.00 };
    
    return {
      input: {
        perToken: pricing.input / 1000000,
        per1kTokens: pricing.input / 1000,
        currency: 'USD'
      },
      output: {
        perToken: pricing.output / 1000000,
        per1kTokens: pricing.output / 1000,
        currency: 'USD'
      }
    };
  }
}
