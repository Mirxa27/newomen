// ElevenLabs Provider Service
// Implementation for ElevenLabs API integration with voice discovery

import { 
  AIModel, 
  AIVoice, 
  ModelListResponse, 
  VoiceListResponse, 
  ProviderTestResult,
  ElevenLabsConfig,
  AIProvider,
  ProviderAuth,
  ProviderEndpoints,
} from './types';
import { BaseProviderService } from './BaseProviderService';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description?: string;
  preview_url?: string;
  category: string;
  labels?: Record<string, string>;
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  fine_tuning?: {
    is_allowed_to_fine_tune: boolean;
    finetuning_state: string;
  };
}

interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

interface ElevenLabsModel {
  model_id: string;
  name: string;
  description: string;
  can_be_finetuned: boolean;
  can_do_text_to_speech: boolean;
  can_do_voice_conversion: boolean;
  can_use_style: boolean;
  can_use_speaker_boost: boolean;
  serves_pro_voices: boolean;
  token_cost_factor: number;
  languages: Array<{
    language_id: string;
    name: string;
  }>;
}

interface ElevenLabsModelsResponse {
  models: ElevenLabsModel[];
}

export class ElevenLabsProviderService extends BaseProviderService {
  private config: ElevenLabsConfig;

  constructor(provider: AIProvider, auth: ProviderAuth, endpoints: ProviderEndpoints, config: ElevenLabsConfig) {
    super(provider, auth, endpoints);
    this.config = config;
  }

  async discoverModels(): Promise<ModelListResponse> {
    try {
      const url = this.buildUrl(this.endpoints.models || '/v1/models');
      const response = await this.makeRequest<ElevenLabsModelsResponse>(url);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch models from ElevenLabs');
      }

      const models: AIModel[] = response.data.models
        .filter(model => model.can_do_text_to_speech)
        .map(model => this.transformElevenLabsModel(model));

      return {
        models,
        total: models.length
      };

    } catch (error) {
      console.error('ElevenLabs model discovery failed:', error);
      throw error;
    }
  }

  async discoverVoices(): Promise<VoiceListResponse> {
    try {
      const url = this.buildUrl(this.endpoints.voices || '/v1/voices');
      const response = await this.makeRequest<ElevenLabsVoicesResponse>(url);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch voices from ElevenLabs');
      }

      const voices: AIVoice[] = response.data.voices
        .map(voice => this.transformElevenLabsVoice(voice));

      return {
        voices,
        total: voices.length
      };

    } catch (error) {
      console.error('ElevenLabs voice discovery failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    try {
      // Test with user info endpoint
      const url = this.buildUrl('/v1/user');
      const response = await this.makeRequest(url);
      
      const responseTime = Date.now() - startTime;
      
      return {
        providerId: this.provider.id,
        endpoint: url,
        statusCode: response.statusCode,
        responseTime,
        isHealthy: response.success,
        timestamp: new Date().toISOString(),
        metadata: {
          subscription: response.data
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = this.parseError(error);

      return {
        providerId: this.provider.id,
        endpoint: '/v1/user',
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
      console.error('ElevenLabs API key validation failed:', error);
      return false;
    }
  }

  // Override auth headers for ElevenLabs
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.auth.apiKey) {
      headers['xi-api-key'] = this.auth.apiKey;
    }

    return headers;
  }

  // Helper methods
  private transformElevenLabsModel(model: ElevenLabsModel): AIModel {
    return {
      id: `${this.provider.id}-${model.model_id}`,
      providerId: this.provider.id,
      modelId: model.model_id,
      displayName: model.name,
      description: model.description,
      modality: 'audio',
      contextLimit: 2500, // Character limit for ElevenLabs
      capabilities: {
        chat: false,
        completion: false,
        streaming: true,
        vision: false,
        tools: false,
        json: false
      },
      latencyMs: this.getEstimatedLatency(model.model_id),
      pricing: this.getModelPricing(model.token_cost_factor),
      enabled: true
    };
  }

  private transformElevenLabsVoice(voice: ElevenLabsVoice): AIVoice {
    // Parse labels for additional info
    const labels = voice.labels || {};
    const gender = this.inferGender(voice.name, labels);
    const age = this.inferAge(labels);
    const accent = labels.accent || 'american';
    
    return {
      id: `${this.provider.id}-${voice.voice_id}`,
      providerId: this.provider.id,
      voiceId: voice.voice_id,
      name: voice.name,
      description: voice.description || `ElevenLabs ${voice.name} voice`,
      gender,
      locale: this.getLocaleFromLabels(labels),
      language: labels.language || 'en',
      accent,
      age,
      style: this.getStylesFromCategory(voice.category),
      sampleUrl: voice.preview_url,
      latencyMs: 2000, // Typical TTS latency
      pricing: {
        perCharacter: 0.00003, // Approximate pricing
        perSecond: 0.0024,
        currency: 'USD'
      },
      enabled: true
    };
  }

  private inferGender(name: string, labels: Record<string, string>): 'male' | 'female' | 'neutral' {
    // Check labels first
    if (labels.gender) {
      const gender = labels.gender.toLowerCase();
      if (gender.includes('male') && !gender.includes('female')) return 'male';
      if (gender.includes('female')) return 'female';
    }

    // Fallback to name-based inference (very basic)
    const maleNames = ['adam', 'antoni', 'arnold', 'bill', 'brian', 'callum', 'charlie', 'clyde', 'daniel', 'dave', 'drew', 'ethan', 'fin', 'george', 'gideon', 'harry', 'james', 'jeremy', 'joseph', 'josh', 'liam', 'marcus', 'matilda', 'michael', 'paul', 'sam', 'thomas', 'will'];
    const femaleNames = ['alice', 'aria', 'bella', 'charlotte', 'cloe', 'domi', 'dorothy', 'elli', 'emily', 'emma', 'freya', 'glinda', 'grace', 'lily', 'mimi', 'nicole', 'rachel', 'sarah', 'serena', 'sophia'];
    
    const nameLower = name.toLowerCase();
    
    if (maleNames.some(n => nameLower.includes(n))) return 'male';
    if (femaleNames.some(n => nameLower.includes(n))) return 'female';
    
    return 'neutral';
  }

  private inferAge(labels: Record<string, string>): 'young' | 'adult' | 'elderly' {
    const ageLabel = labels.age?.toLowerCase() || '';
    
    if (ageLabel.includes('young') || ageLabel.includes('child') || ageLabel.includes('teen')) {
      return 'young';
    }
    if (ageLabel.includes('old') || ageLabel.includes('elderly') || ageLabel.includes('senior')) {
      return 'elderly';
    }
    
    return 'adult';
  }

  private getLocaleFromLabels(labels: Record<string, string>): string {
    const accent = labels.accent?.toLowerCase() || '';
    const language = labels.language?.toLowerCase() || 'en';
    
    // Map accents to locales
    const accentToLocale: Record<string, string> = {
      'american': 'en-US',
      'british': 'en-GB',
      'australian': 'en-AU',
      'canadian': 'en-CA',
      'irish': 'en-IE',
      'scottish': 'en-GB',
      'south-african': 'en-ZA'
    };
    
    if (accentToLocale[accent]) {
      return accentToLocale[accent];
    }
    
    // Default locale mappings
    const languageToLocale: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'pl': 'pl-PL',
      'hi': 'hi-IN',
      'ar': 'ar-SA',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR'
    };
    
    return languageToLocale[language] || 'en-US';
  }

  private getStylesFromCategory(category: string): string[] {
    const categoryStyles: Record<string, string[]> = {
      'generated': ['synthetic', 'ai-generated'],
      'cloned': ['cloned', 'replica'],
      'premade': ['natural', 'professional'],
      'high_quality': ['premium', 'high-quality'],
      'low_latency': ['fast', 'responsive']
    };
    
    return categoryStyles[category] || ['natural'];
  }

  private getEstimatedLatency(modelId: string): number {
    // Different models have different latencies
    const latencyMap: Record<string, number> = {
      'eleven_turbo_v2': 300,
      'eleven_multilingual_v2': 800,
      'eleven_monolingual_v1': 1000,
      'eleven_english_v1': 600
    };
    
    return latencyMap[modelId] || 500;
  }

  private getModelPricing(tokenCostFactor: number) {
    // Base pricing per character (approximate)
    const basePricePerChar = 0.00003;
    const adjustedPrice = basePricePerChar * tokenCostFactor;
    
    return {
      perToken: adjustedPrice,
      per1kTokens: adjustedPrice * 1000,
      currency: 'USD'
    };
  }
}
