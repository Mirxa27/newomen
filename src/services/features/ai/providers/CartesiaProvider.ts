// Cartesia Provider Service
// Implementation for Cartesia API integration with voice discovery

import { 
  AIModel, 
  AIVoice, 
  ModelListResponse, 
  VoiceListResponse, 
  ProviderTestResult,
  SyncResult 
} from './types';
import { BaseProviderService } from './BaseProviderService';

interface CartesiaVoice {
  id: string;
  name: string;
  description?: string;
  gender?: string;
  language?: string;
  accent?: string;
  age?: string;
  style?: string[];
  sample_url?: string;
}

interface CartesiaVoiceResponse {
  voices: CartesiaVoice[];
}

export class CartesiaProviderService extends BaseProviderService {
  constructor(provider: any, auth: any, endpoints: any) {
    super(provider, auth, endpoints);
  }

  async discoverModels(): Promise<ModelListResponse> {
    // Cartesia is primarily a TTS provider, no language models
    return {
      models: [],
      total: 0
    };
  }

  async discoverVoices(): Promise<VoiceListResponse> {
    try {
      const url = this.buildUrl(this.endpoints.voices || '/v1/voices');
      const response = await this.makeRequest<CartesiaVoiceResponse>(url);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch voices from Cartesia');
      }

      const voices: AIVoice[] = response.data.voices.map((voice: CartesiaVoice) => ({
        id: `${this.provider.id}-${voice.id}`,
        providerId: this.provider.id,
        voiceId: voice.id,
        name: voice.name,
        description: voice.description,
        gender: voice.gender as 'male' | 'female' | 'neutral' || 'neutral',
        locale: voice.language || 'en-US',
        language: voice.language || 'English',
        accent: voice.accent,
        age: voice.age as 'young' | 'adult' | 'elderly' || 'adult',
        style: voice.style,
        sampleUrl: voice.sample_url,
        enabled: true
      }));

      return {
        voices,
        total: voices.length
      };
    } catch (error) {
      console.error('Cartesia voice discovery failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<ProviderTestResult> {
    try {
      const startTime = Date.now();
      const url = this.buildUrl('/v1/voices');
      
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
        endpoint: this.buildUrl('/v1/voices'),
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

      // Discover voices (Cartesia is primarily TTS)
      if (this.provider.capabilities.voices) {
        try {
          const voicesResponse = await this.discoverVoices();
          voicesDiscovered = voicesResponse.voices.length;
          await this.saveVoices(voicesResponse.voices);
        } catch (error) {
          const errorMsg = `Voice discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
