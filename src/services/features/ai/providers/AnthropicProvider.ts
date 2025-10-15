// Anthropic Provider Service
// Implementation for Anthropic Claude API integration

import { 
  AIModel, 
  AIVoice, 
  ModelListResponse, 
  VoiceListResponse, 
  ProviderTestResult,
  ModelCapabilities,
  AnthropicConfig 
} from './types';
import { BaseProviderService } from './BaseProviderService';

export class AnthropicProviderService extends BaseProviderService {
  private config: AnthropicConfig;

  constructor(provider: any, auth: any, endpoints: any, config: AnthropicConfig) {
    super(provider, auth, endpoints);
    this.config = config;
  }

  async discoverModels(): Promise<ModelListResponse> {
    // Anthropic doesn't have a models endpoint like OpenAI
    // We'll return the known Claude models
    const knownModels: AIModel[] = [
      {
        id: `${this.provider.id}-claude-3-5-sonnet-20241022`,
        providerId: this.provider.id,
        modelId: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        description: 'Most capable Claude model for complex tasks, coding, and analysis',
        modality: 'multimodal',
        contextLimit: 200000,
        inputPricing: {
          perToken: 0.000003,
          per1kTokens: 0.003,
          currency: 'USD'
        },
        outputPricing: {
          perToken: 0.000015,
          per1kTokens: 0.015,
          currency: 'USD'
        },
        latencyMs: 2500,
        capabilities: {
          chat: true,
          completion: true,
          streaming: true,
          vision: true,
          tools: true,
          json: true
        },
        enabled: true
      },
      {
        id: `${this.provider.id}-claude-3-5-haiku-20241022`,
        providerId: this.provider.id,
        modelId: 'claude-3-5-haiku-20241022',
        displayName: 'Claude 3.5 Haiku',
        description: 'Fastest Claude model for simple tasks and quick responses',
        modality: 'multimodal',
        contextLimit: 200000,
        inputPricing: {
          perToken: 0.00000025,
          per1kTokens: 0.00025,
          currency: 'USD'
        },
        outputPricing: {
          perToken: 0.00000125,
          per1kTokens: 0.00125,
          currency: 'USD'
        },
        latencyMs: 800,
        capabilities: {
          chat: true,
          completion: true,
          streaming: true,
          vision: true,
          tools: true,
          json: true
        },
        enabled: true
      },
      {
        id: `${this.provider.id}-claude-3-opus-20240229`,
        providerId: this.provider.id,
        modelId: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        description: 'Most powerful Claude model for highly complex tasks',
        modality: 'multimodal',
        contextLimit: 200000,
        inputPricing: {
          perToken: 0.000015,
          per1kTokens: 0.015,
          currency: 'USD'
        },
        outputPricing: {
          perToken: 0.000075,
          per1kTokens: 0.075,
          currency: 'USD'
        },
        latencyMs: 4000,
        capabilities: {
          chat: true,
          completion: true,
          streaming: true,
          vision: true,
          tools: true,
          json: true
        },
        enabled: true
      },
      {
        id: `${this.provider.id}-claude-3-sonnet-20240229`,
        providerId: this.provider.id,
        modelId: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet',
        description: 'Balanced Claude model for most tasks',
        modality: 'multimodal',
        contextLimit: 200000,
        inputPricing: {
          perToken: 0.000003,
          per1kTokens: 0.003,
          currency: 'USD'
        },
        outputPricing: {
          perToken: 0.000015,
          per1kTokens: 0.015,
          currency: 'USD'
        },
        latencyMs: 2000,
        capabilities: {
          chat: true,
          completion: true,
          streaming: true,
          vision: true,
          tools: true,
          json: true
        },
        enabled: true
      },
      {
        id: `${this.provider.id}-claude-3-haiku-20240307`,
        providerId: this.provider.id,
        modelId: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        description: 'Fast and cost-effective Claude model',
        modality: 'multimodal',
        contextLimit: 200000,
        inputPricing: {
          perToken: 0.00000025,
          per1kTokens: 0.00025,
          currency: 'USD'
        },
        outputPricing: {
          perToken: 0.00000125,
          per1kTokens: 0.00125,
          currency: 'USD'
        },
        latencyMs: 1000,
        capabilities: {
          chat: true,
          completion: true,
          streaming: true,
          vision: true,
          tools: true,
          json: true
        },
        enabled: true
      }
    ];

    return {
      models: knownModels,
      total: knownModels.length
    };
  }

  async discoverVoices(): Promise<VoiceListResponse> {
    // Anthropic doesn't provide voice synthesis
    return {
      voices: [],
      total: 0
    };
  }

  async testConnection(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    try {
      // Test with a simple message
      const url = this.buildUrl(this.endpoints.chat || '/v1/messages');
      const testPayload = {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      };

      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(testPayload)
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        providerId: this.provider.id,
        endpoint: url,
        statusCode: response.statusCode,
        responseTime,
        isHealthy: response.success,
        timestamp: new Date().toISOString(),
        metadata: {
          testResponse: response.data
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = this.parseError(error);

      return {
        providerId: this.provider.id,
        endpoint: '/v1/messages',
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
      console.error('Anthropic API key validation failed:', error);
      return false;
    }
  }

  // Override auth headers for Anthropic
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.auth.apiKey) {
      headers['x-api-key'] = this.auth.apiKey;
      headers['anthropic-version'] = this.config.version || '2023-06-01';
    }

    return headers;
  }
}
