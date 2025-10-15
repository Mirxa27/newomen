import { BaseProviderService } from './BaseProviderService';
import {
  AIModel,
  ProviderTestResult,
  ModelsDiscoveryResponse,
  ChatCompletionRequest,
  ChatCompletionResponse
} from '../types';

/**
 * Z.AI Provider Service
 * Implements Z.AI API integration (OpenAI-compatible)
 */
export class ZaiProviderService extends BaseProviderService {
  /**
   * Test connection to Z.AI API
   */
  async testConnection(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    const endpoint = this.provider.baseUrl || 'https://api.z.ai/api/coding/paas/v4';

    try {
      // Z.AI uses a chat completions endpoint similar to OpenAI
      const testEndpoint = `${endpoint}/chat/completions`;
      
      const testPayload = {
        model: 'GLM-4.5-Air', // Default Z.AI model
        messages: [
          {
            role: 'user',
            content: 'Health check test'
          }
        ],
        max_tokens: 10,
        temperature: 0.7
      };

      const response = await this.makeRequest<ChatCompletionResponse>(
        testEndpoint,
        {
          method: 'POST',
          body: JSON.stringify(testPayload)
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.success && response.data) {
        return {
          providerId: this.provider.id,
          endpoint: testEndpoint,
          responseTime,
          isHealthy: true,
          timestamp: new Date().toISOString(),
          metadata: {
            model: 'GLM-4.5-Air',
            response: response.data
          }
        };
      }

      return {
        providerId: this.provider.id,
        endpoint: testEndpoint,
        responseTime,
        isHealthy: false,
        timestamp: new Date().toISOString(),
        error: 'Invalid response from Z.AI API'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        providerId: this.provider.id,
        endpoint,
        responseTime,
        isHealthy: false,
        timestamp: new Date().toISOString(),
        error: errorMessage
      };
    }
  }

  /**
   * Discover available models from Z.AI
   */
  async discoverModels(): Promise<ModelsDiscoveryResponse> {
    try {
      // Z.AI has specific models, hardcode them for now
      const models: AIModel[] = [
        {
          id: crypto.randomUUID(),
          providerId: this.provider.id,
          modelId: 'GLM-4.5-Air',
          name: 'GLM-4.5-Air',
          description: 'Fast and efficient model for generating AI suggestions',
          capabilities: ['chat', 'completion'],
          contextWindow: 8192,
          maxOutputTokens: 4096,
          inputCostPer1kTokens: 0.0001,
          outputCostPer1kTokens: 0.0002,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          providerId: this.provider.id,
          modelId: 'GLM-4.6',
          name: 'GLM-4.6',
          description: 'Advanced model for generating comprehensive assessment results',
          capabilities: ['chat', 'completion'],
          contextWindow: 16384,
          maxOutputTokens: 8192,
          inputCostPer1kTokens: 0.0002,
          outputCostPer1kTokens: 0.0004,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return {
        models,
        totalCount: models.length,
        metadata: {
          source: 'hardcoded',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to discover Z.AI models: ${errorMessage}`);
    }
  }

  /**
   * Generate chat completion using Z.AI
   */
  async generateChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const endpoint = `${this.provider.baseUrl}/chat/completions`;

    const payload = {
      model: request.model || 'GLM-4.5-Air',
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1500,
      stream: request.stream ?? false,
      ...(request.responseFormat && { response_format: request.responseFormat })
    };

    const response = await this.makeRequest<ChatCompletionResponse>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to generate chat completion');
    }

    return response.data;
  }
}

