// Google Provider Service
// Implementation for Google Gemini API integration

import { 
  AIModel, 
  AIVoice, 
  ModelListResponse, 
  VoiceListResponse, 
  ProviderTestResult,
  ModelCapabilities,
  GoogleConfig 
} from './types';
import { BaseProviderService } from './BaseProviderService';

export class GoogleProviderService extends BaseProviderService {
  private config: GoogleConfig;

  constructor(provider: any, auth: any, endpoints: any, config: GoogleConfig) {
    super(provider, auth, endpoints);
    this.config = config;
  }

  async discoverModels(): Promise<ModelListResponse> {
    // Google Gemini models (known models)
    const knownModels: AIModel[] = [
      {
        id: `${this.provider.id}-gemini-1.5-pro`,
        providerId: this.provider.id,
        modelId: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Most capable Gemini model for complex tasks and multimodal understanding',
        modality: 'multimodal',
        contextLimit: 2000000,
        inputPricing: {
          perToken: 0.00000125,
          per1kTokens: 0.00125,
          currency: 'USD'
        },
        outputPricing: {
          perToken: 0.000005,
          per1kTokens: 0.005,
          currency: 'USD'
        },
        latencyMs: 1500,
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
        id: `${this.provider.id}-gemini-1.5-flash`,
        providerId: this.provider.id,
        modelId: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast and efficient Gemini model for most tasks',
        modality: 'multimodal',
        contextLimit: 1000000,
        inputPricing: {
          perToken: 0.000000075,
          per1kTokens: 0.000075,
          currency: 'USD'
        },
        outputPricing: {
          perToken: 0.0000003,
          per1kTokens: 0.0003,
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
        id: `${this.provider.id}-gemini-1.0-pro`,
        providerId: this.provider.id,
        modelId: 'gemini-1.0-pro',
        displayName: 'Gemini 1.0 Pro',
        description: 'Original Gemini Pro model for text and code generation',
        modality: 'text',
        contextLimit: 30720,
        inputPricing: {
          perToken: 0.0000005,
          per1kTokens: 0.0005,
          currency: 'USD'
        },
        outputPricing: {
          perToken: 0.0000015,
          per1kTokens: 0.0015,
          currency: 'USD'
        },
        latencyMs: 1200,
        capabilities: {
          chat: true,
          completion: true,
          streaming: true,
          vision: false,
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
    // Google doesn't provide voice synthesis through Gemini API
    return {
      voices: [],
      total: 0
    };
  }

  async testConnection(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    try {
      const url = this.buildUrl('/v1beta/models');
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
        endpoint: '/v1beta/models',
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
      console.error('Google API key validation failed:', error);
      return false;
    }
  }

  // Override auth headers for Google
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.auth.apiKey) {
      headers['Authorization'] = `Bearer ${this.auth.apiKey}`;
    }

    return headers;
  }
}
