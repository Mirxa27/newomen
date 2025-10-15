// Hume AI Provider Service
// Implementation for Hume AI API integration with emotion analysis

import { 
  AIModel, 
  AIVoice, 
  ModelListResponse, 
  VoiceListResponse, 
  ProviderTestResult,
  HumeConfig,
  SyncResult 
} from './types';
import { BaseProviderService } from './BaseProviderService';

interface HumeModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  input_types: string[];
  output_types: string[];
}

interface HumeModelsResponse {
  models: HumeModel[];
}

export class HumeProviderService extends BaseProviderService {
  private config: HumeConfig;

  constructor(provider: any, auth: any, endpoints: any, config: HumeConfig) {
    super(provider, auth, endpoints);
    this.config = config;
  }

  async discoverModels(): Promise<ModelListResponse> {
    try {
      const url = this.buildUrl('/v0/models');
      const response = await this.makeRequest<HumeModelsResponse>(url);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch models from Hume AI');
      }

      const models: AIModel[] = response.data.models.map((model: HumeModel) => ({
        id: `${this.provider.id}-${model.id}`,
        providerId: this.provider.id,
        modelId: model.id,
        displayName: model.name,
        description: model.description,
        modality: 'multimodal' as const,
        contextLimit: 0, // Emotion analysis models don't have context limits
        capabilities: {
          chat: false,
          completion: false,
          streaming: true,
          vision: model.input_types.includes('image'),
          tools: false,
          json: true
        },
        isRealtime: true,
        enabled: true
      }));

      return {
        models,
        total: models.length
      };
    } catch (error) {
      console.error('Hume AI model discovery failed:', error);
      throw error;
    }
  }

  async discoverVoices(): Promise<VoiceListResponse> {
    // Hume AI is primarily emotion analysis, not TTS
    return {
      voices: [],
      total: 0
    };
  }

  async testConnection(): Promise<ProviderTestResult> {
    try {
      const startTime = Date.now();
      const url = this.buildUrl('/v0/models');
      
      const response = await this.makeRequest(url);
      const responseTime = Date.now() - startTime;

      return {
        providerId: this.provider.id,
        endpoint: url,
        responseTime,
        isHealthy: response.success,
        timestamp: new Date().toISOString(),
        error: response.success ? undefined : response.error
      };
    } catch (error) {
      return {
        providerId: this.provider.id,
        endpoint: this.buildUrl('/v0/models'),
        responseTime: 0,
        isHealthy: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async syncAll(): Promise<SyncResult> {
    const startedAt = new Date().toISOString();
    let modelsDiscovered = 0;
    let voicesDiscovered = 0;
    const errors: string[] = [];

    try {
      // Test connection first
      const testResult = await this.testConnection();
      if (!testResult.isHealthy) {
        throw new Error(`Provider health check failed: ${testResult.error}`);
      }

      // Discover models (Hume AI is primarily emotion analysis)
      if (this.provider.capabilities.models) {
        try {
          const modelsResponse = await this.discoverModels();
          modelsDiscovered = modelsResponse.models.length;
          await this.saveModels(modelsResponse.models);
        } catch (error) {
          const errorMsg = `Model discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`[${this.provider.name}] ${errorMsg}`);
        }
      }

      return {
        providerId: this.provider.id,
        syncType: 'full',
        status: errors.length === 0 ? 'success' : 'partial',
        startedAt,
        completedAt: new Date().toISOString(),
        modelsDiscovered,
        voicesDiscovered,
        errors,
        metadata: {}
      };
    } catch (error) {
      const errorMsg = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      
      return {
        providerId: this.provider.id,
        syncType: 'full',
        status: 'failed',
        startedAt,
        completedAt: new Date().toISOString(),
        modelsDiscovered,
        voicesDiscovered,
        errors,
        metadata: {}
      };
    }
  }
}
