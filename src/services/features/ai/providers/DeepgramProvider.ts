// Deepgram Provider Service
// Implementation for Deepgram API integration with STT capabilities

import { 
  AIModel, 
  AIVoice, 
  ModelListResponse, 
  VoiceListResponse, 
  ProviderTestResult,
  SyncResult 
} from './types';
import { BaseProviderService } from './BaseProviderService';

interface DeepgramModel {
  name: string;
  language: string;
  version: string;
  model_id: string;
  can_do_streaming: boolean;
  can_do_utterance_end: boolean;
  can_do_word_boost: boolean;
  can_do_encoding: string[];
  can_do_sample_rates: number[];
}

interface DeepgramModelsResponse {
  models: DeepgramModel[];
}

export class DeepgramProviderService extends BaseProviderService {
  constructor(provider: any, auth: any, endpoints: any) {
    super(provider, auth, endpoints);
  }

  async discoverModels(): Promise<ModelListResponse> {
    try {
      const url = this.buildUrl('/v1/projects/{project_id}/model');
      const response = await this.makeRequest<DeepgramModelsResponse>(url);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch models from Deepgram');
      }

      const models: AIModel[] = response.data.models.map((model: DeepgramModel) => ({
        id: `${this.provider.id}-${model.model_id}`,
        providerId: this.provider.id,
        modelId: model.model_id,
        displayName: model.name,
        description: `Deepgram ${model.language} model`,
        modality: 'audio' as const,
        contextLimit: 0, // STT models don't have context limits
        capabilities: {
          chat: false,
          completion: false,
          streaming: model.can_do_streaming,
          vision: false,
          tools: false,
          json: false
        },
        isRealtime: model.can_do_streaming,
        enabled: true
      }));

      return {
        models,
        total: models.length
      };
    } catch (error) {
      console.error('Deepgram model discovery failed:', error);
      throw error;
    }
  }

  async discoverVoices(): Promise<VoiceListResponse> {
    // Deepgram is primarily STT, not TTS
    return {
      voices: [],
      total: 0
    };
  }

  async testConnection(): Promise<ProviderTestResult> {
    try {
      const startTime = Date.now();
      const url = this.buildUrl('/v1/projects');
      
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
        endpoint: this.buildUrl('/v1/projects'),
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

      // Discover models (Deepgram is primarily STT)
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
