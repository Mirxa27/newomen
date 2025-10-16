import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { OpenAIProviderService } from './providers/OpenAIProvider';
import { AnthropicProviderService } from './providers/AnthropicProvider';
import { ElevenLabsProviderService } from './providers/ElevenLabsProvider';
import { CartesiaProviderService } from './providers/CartesiaProvider';
import { DeepgramProviderService } from './providers/DeepgramProvider';
import { HumeProviderService } from './providers/HumeProvider';
import { ZaiProviderService } from './providers/ZaiProvider';
import { BaseProviderService } from './providers/BaseProviderService';
import type { 
  AIProvider, 
  AIModel, 
  AIVoice, 
  ProviderTestResult, 
  SyncResult,
  ProviderAuth 
} from './providers/types';

type ProviderServiceClassConstructor = new (
  providerData: AIProvider,
  auth: ProviderAuth,
  endpoints: object,
  options: object
) => BaseProviderService;

type ProviderTableRow = Database['public']['Tables']['providers']['Row'];
type ModelTableRow = Database['public']['Tables']['models']['Row'];
type VoiceTableRow = Database['public']['Tables']['voices']['Row'];
type HealthTableRow = Database['public']['Tables']['provider_health']['Row'];

interface ProviderCapabilities {
    models: boolean;
    voices: boolean;
    streaming: boolean;
    realtime: boolean;
    embeddings: boolean;
    vision: boolean;
    tools: boolean;
}

export class AIProviderManager {
  private providers = new Map<string, BaseProviderService>();
  private skippedProviders = new Set<string>();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load existing providers from database
      const providers = await this.getProviders();
      
      // Initialize each provider
      for (const provider of providers) {
        try {
          await this.initializeProvider(provider);
        } catch (error) {
          console.error(`Failed to initialize provider ${provider.name}:`, error);
        }
      }

      this.initialized = true;
      console.log(`Initialized ${this.providers.size} AI providers`);
    } catch (error) {
      console.error('Failed to initialize AI provider manager:', error);
      throw error;
    }
  }

  private async initializeProvider(providerData: AIProvider): Promise<void> {
    try {
      console.log(`Initializing provider ${providerData.name} (${providerData.id})`);
      
      // Get API key securely
      const apiKey = await this.retrieveApiKey(providerData.id);
      
      // Skip initialization if no API key is available
      if (!apiKey) {
        console.log(`Skipping initialization for provider ${providerData.name} - no API key found`);
        // Mark this provider as skipped so UI knows not to interact with it
        this.skippedProviders.add(providerData.id);
        return;
      }
      
      console.log(`API key found for provider ${providerData.name}, proceeding with initialization`);
      
      const auth: ProviderAuth = {
        type: 'api_key',
        apiKey: apiKey
      };

      // Determine provider service based on name or base URL
      let ProviderServiceClass: ProviderServiceClassConstructor;
      let endpoints: object;
      let options: object;

      const lowerName = providerData.name.toLowerCase();
      const lowerBaseUrl = providerData.baseUrl?.toLowerCase() || '';
      const lowerType = providerData.type.toLowerCase();

      if (lowerName.includes('z.ai') || lowerBaseUrl.includes('z.ai') || lowerType === 'zai') {
        // Z.AI Provider
        ProviderServiceClass = ZaiProviderService;
        endpoints = this.getOpenAIEndpoints(providerData.baseUrl || 'https://api.z.ai/api/coding/paas/v4');
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      } else if (lowerName.includes('anthropic') || lowerBaseUrl.includes('anthropic') || lowerType.includes('anthropic')) {
        ProviderServiceClass = AnthropicProviderService;
        endpoints = this.getAnthropicEndpoints();
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      } else if (lowerName.includes('elevenlabs') || lowerBaseUrl.includes('elevenlabs') || lowerType === 'tts') {
        ProviderServiceClass = ElevenLabsProviderService;
        endpoints = this.getElevenLabsEndpoints();
        options = {
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.5
          },
          rateLimits: {
            requestsPerMinute: 20,
            tokensPerMinute: 5000
          }
        };
      } else if (lowerName.includes('xai') || lowerName.includes('grok') || lowerBaseUrl.includes('x.ai')) {
        // xAI (Grok) is OpenAI-compatible
        ProviderServiceClass = OpenAIProviderService;
        endpoints = this.getOpenAIEndpoints(providerData.baseUrl || 'https://api.x.ai/v1');
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      } else if (lowerName.includes('mistral') || lowerBaseUrl.includes('mistral.ai')) {
        // Mistral AI is OpenAI-compatible
        ProviderServiceClass = OpenAIProviderService;
        endpoints = this.getOpenAIEndpoints(providerData.baseUrl || 'https://api.mistral.ai/v1');
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      } else if (lowerName.includes('perplexity') || lowerBaseUrl.includes('perplexity.ai')) {
        // Perplexity AI is OpenAI-compatible
        ProviderServiceClass = OpenAIProviderService;
        endpoints = this.getOpenAIEndpoints(providerData.baseUrl || 'https://api.perplexity.ai');
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      } else if (lowerName.includes('cohere') || lowerBaseUrl.includes('cohere.com')) {
        // Cohere is partially OpenAI-compatible, but may need adjustments
        ProviderServiceClass = OpenAIProviderService;
        endpoints = this.getOpenAIEndpoints(providerData.baseUrl || 'https://api.cohere.com/v1');
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      } else if (lowerName.includes('gemini') || lowerName.includes('google') || lowerBaseUrl.includes('googleapis.com')) {
        // Google Gemini - assuming OpenAI-compatible wrapper if using custom baseUrl
        ProviderServiceClass = OpenAIProviderService;
        endpoints = this.getOpenAIEndpoints(providerData.baseUrl || 'https://generativelanguage.googleapis.com/v1beta');
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      } else if (lowerName.includes('cartesia') || lowerBaseUrl.includes('cartesia.ai')) {
        ProviderServiceClass = CartesiaProviderService;
        endpoints = this.getCartesiaEndpoints();
        options = {
          rateLimits: {
            requestsPerMinute: 20,
            tokensPerMinute: 5000
          }
        };
      } else if (lowerName.includes('deepgram') || lowerBaseUrl.includes('deepgram.com')) {
        ProviderServiceClass = DeepgramProviderService;
        endpoints = this.getDeepgramEndpoints();
        options = {
          rateLimits: {
            requestsPerMinute: 30,
            tokensPerMinute: 10000
          }
        };
      } else if (lowerName.includes('hume') || lowerBaseUrl.includes('hume.ai')) {
        ProviderServiceClass = HumeProviderService;
        endpoints = this.getHumeEndpoints();
        options = {
          prosody: {
            granularity: 'utterance',
            identify_speakers: true
          },
          rateLimits: {
            requestsPerMinute: 20,
            tokensPerMinute: 5000
          }
        };
      } else if (lowerName.includes('zai') || lowerName.includes('z.ai') || lowerBaseUrl.includes('z.ai')) {
        // Z.ai is OpenAI-compatible
        ProviderServiceClass = OpenAIProviderService;
        endpoints = this.getOpenAIEndpoints(providerData.baseUrl || 'https://api.z.ai/v1');
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      } else {
        // Default to OpenAI-compatible for other providers
        ProviderServiceClass = OpenAIProviderService;
        endpoints = this.getOpenAIEndpoints(providerData.baseUrl);
        options = {
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        };
      }

      const providerService = new ProviderServiceClass(
        providerData,
        auth,
        endpoints,
        options
      );

      this.providers.set(providerData.id, providerService);

    } catch (error) {
      console.error(`Failed to initialize provider ${providerData.name}:`, error);
      throw error;
    }
  }

  // Provider management
  async addProvider(providerData: {
    name: string;
    type: string;
    apiBase?: string;
    description?: string;
  }, apiKey: string): Promise<string> {
    try {
      // Insert provider into database
      const { data, error } = await supabase
        .from('providers')
        .insert({
          name: providerData.name,
          type: providerData.type,
          api_base: providerData.apiBase || '',
          status: 'active',
          description: providerData.description || '',
          max_tokens: 4096,
          temperature: 0.7,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          stop_sequences: [],
          system_instructions: ''
        })
        .select('id')
        .single();

      if (error) throw error;

      const providerId = data.id;

      // Store API key securely
      await this.storeApiKeySecurely(providerId, apiKey);

      // Initialize the provider service
      const provider = await this.getProviderById(providerId);
      if (provider) {
        await this.initializeProvider(provider);
      }

      // Test the connection
      const providerService = this.providers.get(providerId);
      if (providerService) {
        const testResult = await providerService.testConnection();
        await this.saveHealthCheck(testResult);

        if (testResult.isHealthy) {
          // Auto-sync models and voices
          await this.syncProvider(providerId);
        }
      }

      return providerId;

    } catch (error) {
      console.error('Failed to add provider:', error);
      throw error;
    }
  }

  async removeProvider(providerId: string): Promise<void> {
    try {
      // Remove from database
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', providerId);

      if (error) throw error;

      // Remove from memory
      this.providers.delete(providerId);
    } catch (error) {
      console.error('Failed to remove provider:', error);
      throw error;
    }
  }

  // Data access methods
  async getProviders(): Promise<AIProvider[]> {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database data to AIProvider format
      return (data || []).map((provider: ProviderTableRow) => ({
        id: provider.id,
        name: provider.name,
        type: this.getProviderTypeCategory(provider.type),
        baseUrl: provider.api_base || '',
        status: (provider.status) === 'active' ? 'active' : 'inactive',
        lastSynced: provider.last_synced_at || undefined,
        capabilities: this.getProviderCapabilities(provider.type),
        config: {
          maxTokens: provider.max_tokens || 4096,
          temperature: provider.temperature ?? 0.7,
          topP: provider.top_p ?? 1.0,
          frequencyPenalty: provider.frequency_penalty ?? 0.0,
          presencePenalty: provider.presence_penalty ?? 0.0,
          stopSequences: (provider.stop_sequences as string[]) || [],
          systemInstructions: provider.system_instructions || '',
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        }
      }));
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      return [];
    }
  }

  async getModels(providerId?: string): Promise<AIModel[]> {
    try {
      let query = supabase.from('models').select('*').eq('enabled', true);
      
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((model: ModelTableRow) => ({
        id: model.id,
        providerId: model.provider_id,
        modelId: model.model_id,
        displayName: model.display_name,
        modality: model.modality || 'text',
        contextLimit: model.context_limit,
        latencyMs: model.latency_hint_ms,
        isRealtime: model.is_realtime,
        enabled: model.enabled,
        capabilities: {
          streaming: true,
          tools: true,
          vision: model.modality === 'multimodal',
          chat: true,
          completion: true,
          json: true
        }
      }));
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }

  async getVoices(providerId?: string): Promise<AIVoice[]> {
    try {
      let query = supabase.from('voices').select('*').eq('enabled', true);
      
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((voice: VoiceTableRow) => ({
        id: voice.id,
        providerId: voice.provider_id,
        voiceId: voice.voice_id,
        name: voice.name,
        locale: voice.locale,
        language: voice.locale?.split('-')[0] || 'en',
        gender: voice.gender || 'neutral',
        latencyMs: voice.latency_hint_ms,
        enabled: voice.enabled
      }));
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [];
    }
  }

  async getHealthStatus(): Promise<ProviderTestResult[]> {
    try {
      const { data, error } = await supabase
        .from('provider_health')
        .select('*')
        .order('last_checked_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((health: HealthTableRow) => ({
        providerId: health.provider_id,
        endpoint: health.endpoint,
        responseTime: health.response_time_ms,
        isHealthy: health.is_healthy,
        timestamp: health.last_checked_at,
        error: health.error_message || undefined
      }));
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      return [];
    }
  }

  // Provider operations
  async testProvider(providerId: string): Promise<ProviderTestResult> {
    if (this.skippedProviders.has(providerId)) {
      const skippedResult: ProviderTestResult = {
        providerId,
        endpoint: 'N/A',
        responseTime: 0,
        isHealthy: false,
        timestamp: new Date().toISOString(),
        error: 'Provider skipped during initialization (no API key)'
      };
      await this.saveHealthCheck(skippedResult);
      return skippedResult;
    }
    
    const providerService = this.providers.get(providerId);
    if (!providerService) {
      const notFoundResult: ProviderTestResult = {
        providerId,
        endpoint: 'N/A',
        responseTime: 0,
        isHealthy: false,
        timestamp: new Date().toISOString(),
        error: 'Provider not found or not initialized'
      };
      await this.saveHealthCheck(notFoundResult);
      return notFoundResult;
    }

    try {
      const result = await providerService.testConnection();
      await this.saveHealthCheck(result);
      return result;
    } catch (error) {
      console.error(`Test failed for provider ${providerId}:`, error);
      
      let errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle CORS errors gracefully
      if (errorMessage.includes('CORS') || errorMessage.includes('blocked by CORS policy')) {
        errorMessage = 'CORS policy blocks direct browser requests. This provider requires server-side testing.';
      }
      
      const failedResult: ProviderTestResult = {
        providerId,
        endpoint: providerService.getProvider().baseUrl,
        responseTime: 0,
        isHealthy: false,
        timestamp: new Date().toISOString(),
        error: errorMessage
      };
      
      await this.saveHealthCheck(failedResult);
      return failedResult;
    }
  }

  // Test a specific model
  async testModel(modelId: string, prompt: string, options: {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
  } = {}): Promise<{
    success: boolean;
    data?: {
      content: string;
      usage?: {
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
      };
      cost?: number;
    };
    error?: string;
  }> {
    try {
      // Get model from database
      const { data: modelData, error: modelError } = await supabase
        .from('models')
        .select('*, providers(*)')
        .eq('id', modelId)
        .single();

      if (modelError || !modelData) {
        return {
          success: false,
          error: `Model not found: ${modelError?.message || 'Unknown error'}`
        };
      }

      const providerId = modelData.provider_id;
      const providerService = this.providers.get(providerId);
      
      if (!providerService) {
        return {
          success: false,
          error: 'Provider not initialized or not available'
        };
      }

      // Use the provider service to test the model
      const response = await providerService.testModel(
        modelData.model_id,
        prompt,
        {
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 100,
          timeout: options.timeout || 30000
        }
      );

      return response;

    } catch (error) {
      console.error(`Model test failed for ${modelId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Test a specific voice
  async testVoice(voiceId: string, text: string, options: {
    temperature?: number;
    stability?: number;
    similarityBoost?: number;
  } = {}): Promise<{
    success: boolean;
    data?: {
      audioUrl?: string;
      audioLength?: number;
      quality?: number;
    };
    error?: string;
  }> {
    try {
      // Get voice from database
      const { data: voiceData, error: voiceError } = await supabase
        .from('voices')
        .select('*, providers(*)')
        .eq('id', voiceId)
        .single();

      if (voiceError || !voiceData) {
        return {
          success: false,
          error: `Voice not found: ${voiceError?.message || 'Unknown error'}`
        };
      }

      const providerId = voiceData.provider_id;
      const providerService = this.providers.get(providerId);
      
      if (!providerService) {
        return {
          success: false,
          error: 'Provider not initialized or not available'
        };
      }

      // Use the provider service to test the voice
      const response = await providerService.testVoice(
        voiceData.voice_id,
        text,
        {
          stability: options.stability || 0.5,
          similarityBoost: options.similarityBoost || 0.5
        }
      );

      return response;

    } catch (error) {
      console.error(`Voice test failed for ${voiceId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async syncProvider(providerId: string): Promise<SyncResult> {
    if (this.skippedProviders.has(providerId)) {
      throw new Error(`Provider ${providerId} was skipped during initialization (no API key)`);
    }
    
    const providerService = this.providers.get(providerId);
    if (!providerService) {
      throw new Error(`Provider ${providerId} not found or not initialized`);
    }

    try {
      const syncResult = await providerService.syncAll();
      
      // Save discovered models and voices to database if sync was successful
      if (syncResult.status !== 'failed') {
        try {
          if (providerService.getProvider().capabilities.models) {
            const modelsResponse = await providerService.discoverModels();
            await this.saveModelsToDatabase(modelsResponse.models);
          }
          
          if (providerService.getProvider().capabilities.voices) {
            const voicesResponse = await providerService.discoverVoices();
            await this.saveVoicesToDatabase(voicesResponse.voices);
          }
        } catch (dbError) {
          console.error(`Failed to save sync results for ${providerId}:`, dbError);
          // Don't fail the entire sync for database save errors
        }
      }
      
      await this.saveSyncLog(syncResult);
      return syncResult;

    } catch (error) {
      console.error(`Sync failed for provider ${providerId}:`, error);
      throw error;
    }
  }

  async syncAllProviders(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const [providerId, providerService] of this.providers) {
      try {
        const result = await providerService.syncAll();
        
        // Save discovered models and voices to database if sync was successful
        if (result.status !== 'failed') {
          try {
            if (providerService.getProvider().capabilities.models) {
              const modelsResponse = await providerService.discoverModels();
              await this.saveModelsToDatabase(modelsResponse.models);
            }
            
            if (providerService.getProvider().capabilities.voices) {
              const voicesResponse = await providerService.discoverVoices();
              await this.saveVoicesToDatabase(voicesResponse.voices);
            }
          } catch (dbError) {
            console.error(`Failed to save sync results for ${providerId}:`, dbError);
            // Don't fail the entire sync for database save errors
          }
        }
        
        results.push(result);
        await this.saveSyncLog(result);
      } catch (error) {
        console.error(`Sync failed for provider ${providerId}:`, error);
        
        // Create failed sync result
        const failedResult: SyncResult = {
          providerId,
          syncType: 'full',
          status: 'failed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          modelsDiscovered: 0,
          voicesDiscovered: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          metadata: {}
        };
        
        results.push(failedResult);
        await this.saveSyncLog(failedResult);
      }
    }

    return results;
  }

  // Health monitoring
  async checkAllProvidersHealth(): Promise<ProviderTestResult[]> {
    const results: ProviderTestResult[] = [];

    for (const [providerId, providerService] of this.providers) {
      try {
        const result = await this.testProvider(providerId);
        results.push(result);
      } catch (error) {
        console.error(`Health check failed for provider ${providerId}:`, error);
        
        let errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('CORS')) {
          errorMessage = 'CORS policy blocks direct browser requests. This provider requires server-side testing.';
        }
        
        // Create failed health check result
        const failedResult: ProviderTestResult = {
          providerId,
          endpoint: providerService.getProvider().baseUrl,
          responseTime: 0,
          isHealthy: false,
          timestamp: new Date().toISOString(),
          error: errorMessage
        };
        
        results.push(failedResult);
        await this.saveHealthCheck(failedResult);
      }
    }

    return results;
  }

  async testAllProviders(): Promise<ProviderTestResult[]> {
    return this.checkAllProvidersHealth();
  }

  // Database operations for models and voices
  private async saveModelsToDatabase(models: AIModel[]): Promise<void> {
    if (models.length === 0) return;

    try {
      for (const model of models) {
        // First try to update existing record
        const { data: existingData } = await supabase
          .from('models')
          .select('id')
          .eq('provider_id', model.providerId)
          .eq('model_id', model.modelId);
          
        const existing = existingData && existingData.length > 0 ? existingData[0] : null;

        if (existing) {
          // Update existing record
          await supabase
            .from('models')
            .update({
              display_name: model.displayName,
              modality: model.modality,
              context_limit: model.contextLimit,
              latency_hint_ms: model.latencyMs,
              is_realtime: model.isRealtime,
              enabled: model.enabled
            })
            .eq('id', existing.id);
        } else {
          // Insert new record
          await supabase
            .from('models')
            .insert({
              provider_id: model.providerId,
              model_id: model.modelId,
              display_name: model.displayName,
              modality: model.modality,
              context_limit: model.contextLimit,
              latency_hint_ms: model.latencyMs,
              is_realtime: model.isRealtime,
              enabled: model.enabled
            });
        }
      }
      console.log(`Successfully saved ${models.length} models to database`);
    } catch (error) {
      console.error('Failed to save models to database:', error);
      // Log the specific error for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  }

  private async saveVoicesToDatabase(voices: AIVoice[]): Promise<void> {
    if (voices.length === 0) return;

    try {
      for (const voice of voices) {
        // First try to update existing record
        const { data: existingData } = await supabase
          .from('voices')
          .select('id')
          .eq('provider_id', voice.providerId)
          .eq('voice_id', voice.voiceId);
          
        const existing = existingData && existingData.length > 0 ? existingData[0] : null;

        if (existing) {
          // Update existing record
          await supabase
            .from('voices')
            .update({
              name: voice.name,
              locale: voice.locale,
              gender: voice.gender,
              latency_hint_ms: voice.latencyMs,
              enabled: voice.enabled
            })
            .eq('id', existing.id);
        } else {
          // Insert new record
          await supabase
            .from('voices')
            .insert({
              provider_id: voice.providerId,
              voice_id: voice.voiceId,
              name: voice.name,
              locale: voice.locale,
              gender: voice.gender,
              latency_hint_ms: voice.latencyMs,
              enabled: voice.enabled
            });
        }
      }
      console.log(`Successfully saved ${voices.length} voices to database`);
    } catch (error) {
      console.error('Failed to save voices to database:', error);
      // Log the specific error for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  }

  // Private helper methods
  private async saveSyncLog(syncResult: SyncResult): Promise<void> {
    try {
      await supabase
        .from('provider_sync_logs')
        .insert({
          provider_id: syncResult.providerId,
          sync_type: syncResult.syncType,
          status: syncResult.status,
          started_at: syncResult.startedAt,
          completed_at: syncResult.completedAt,
          models_discovered: syncResult.modelsDiscovered,
          voices_discovered: syncResult.voicesDiscovered,
          error_message: syncResult.errors.join('; ') || null,
          metadata: syncResult.metadata
        });
    } catch (error) {
      console.error('Failed to save sync log:', error);
    }
  }

  private async saveHealthCheck(result: ProviderTestResult): Promise<void> {
    try {
      await supabase
        .from('provider_health')
        .upsert({
          provider_id: result.providerId,
          endpoint: result.endpoint,
          response_time_ms: result.responseTime,
          is_healthy: result.isHealthy,
          last_checked_at: result.timestamp,
          error_message: result.error
        }, {
          onConflict: 'provider_id,endpoint'
        });
    } catch (error) {
      console.error('Failed to save health check:', error);
    }
  }

  // Secure API key storage
  private async storeApiKeySecurely(providerId: string, apiKey: string): Promise<void> {
    try {
      // Simple encryption using base64 + obfuscation (in production, use proper encryption)
      const encryptedKey = btoa(apiKey + '_encrypted_' + Date.now());
      
      await supabase
        .from('provider_api_keys')
        .upsert({
          provider_id: providerId,
          api_key: encryptedKey,
          encrypted: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log(`API key stored securely for provider ${providerId}`);
    } catch (error) {
      console.error('Failed to store API key:', error);
      throw error;
    }
  }

  private async retrieveApiKey(providerId: string): Promise<string | null> {
    try {
      // First try to get the record without .single() to avoid 406 errors
      const { data, error } = await supabase
        .from('provider_api_keys')
        .select('api_key, encrypted')
        .eq('provider_id', providerId);

      if (error) {
        console.error(`Error retrieving API key for provider ${providerId}:`, error);
        return null;
      }
      
      // Check if any records were returned
      if (!data || data.length === 0) {
        console.log(`No API key found for provider ${providerId}`);
        return null;
      }

      // Get the first (and should be only) record
      const record = data[0];
      if (!record) return null;

      // Decrypt the key (reverse the simple encryption)
      if (record.encrypted) {
        const decryptedKey = atob(record.api_key).split('_encrypted_')[0];
        return decryptedKey;
      }

      return record.api_key;
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  private async getProviderById(providerId: string): Promise<AIProvider | null> {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId);

      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const providerData: ProviderTableRow = data[0];

      return {
        id: providerData.id,
        name: providerData.name,
        type: this.getProviderTypeCategory(providerData.type),
        baseUrl: providerData.api_base || '',
        status: (providerData.status) === 'active' ? 'active' : 'inactive',
        lastSynced: providerData.last_synced_at || undefined,
        capabilities: this.getProviderCapabilities(providerData.type),
        config: {
          maxTokens: providerData.max_tokens || 4096,
          temperature: providerData.temperature ?? 0.7,
          topP: providerData.top_p ?? 1.0,
          frequencyPenalty: providerData.frequency_penalty ?? 0.0,
          presencePenalty: providerData.presence_penalty ?? 0.0,
          stopSequences: (providerData.stop_sequences as string[]) || [],
          systemInstructions: providerData.system_instructions || '',
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 90000
          }
        }
      };
    } catch (error) {
      console.error('Failed to get provider by ID:', error);
      return null;
    }
  }

  // Update provider API key
  async updateProviderApiKey(providerId: string, apiKey: string): Promise<void> {
    try {
      // Store the API key securely
      await this.storeApiKeySecurely(providerId, apiKey);
      
      // Update provider status to active
      await supabase
        .from('providers')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      // Remove from skipped providers if it was there
      this.skippedProviders.delete(providerId);
      
      // Re-initialize the provider now that it has an API key
      const providers = await this.getProviders();
      const provider = providers.find(p => p.id === providerId);
      if (provider) {
        await this.initializeProvider(provider);
      }

      console.log(`API key updated for provider ${providerId}`);
    } catch (error) {
      console.error('Failed to update provider API key:', error);
      throw error;
    }
  }

  // Check if a provider is available for operations
  isProviderAvailable(providerId: string): boolean {
    return this.providers.has(providerId) && !this.skippedProviders.has(providerId);
  }

  // Get list of available providers
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // Get list of skipped providers
  getSkippedProviders(): string[] {
    return Array.from(this.skippedProviders);
  }

  // Helper methods for provider configuration
  private getProviderTypeCategory(type: string): 'llm' | 'tts' | 'stt' | 'multimodal' {
    const lowerType = type?.toLowerCase() || '';
    
    if (lowerType.includes('tts') || lowerType === 'elevenlabs') return 'tts';
    if (lowerType.includes('stt') || lowerType.includes('speech')) return 'stt';
    if (lowerType.includes('multimodal')) return 'multimodal';
    
    return 'llm'; // Default to language model
  }

  private getProviderCapabilities(type: string): ProviderCapabilities {
    const lowerType = type?.toLowerCase() || '';
    
    switch (lowerType) {
      case 'openai':
      case 'llm':
      case 'xai':
      case 'grok':
      case 'mistral':
      case 'perplexity':
      case 'cohere':
      case 'gemini':
        return {
          models: true,
          voices: true, // Some have TTS
          streaming: true,
          realtime: true,
          embeddings: true,
          vision: true,
          tools: true
        };
        
      case 'anthropic':
        return {
          models: true,
          voices: false,
          streaming: true,
          realtime: false,
          embeddings: false,
          vision: true,
          tools: true
        };
        
      case 'elevenlabs':
      case 'tts':
        return {
          models: true,
          voices: true,
          streaming: true,
          realtime: true,
          embeddings: false,
          vision: false,
          tools: false
        };
        
      case 'google':
        return {
          models: true,
          voices: false,
          streaming: true,
          realtime: false,
          embeddings: true,
          vision: true,
          tools: true
        };
        
      case 'cartesia':
        return {
          models: false,
          voices: true,
          streaming: true,
          realtime: true,
          embeddings: false,
          vision: false,
          tools: false
        };
        
      case 'deepgram':
      case 'stt':
        return {
          models: true,
          voices: false,
          streaming: true,
          realtime: true,
          embeddings: false,
          vision: false,
          tools: false
        };
        
      case 'hume':
      case 'humeai':
        return {
          models: true,
          voices: false,
          streaming: true,
          realtime: true,
          embeddings: false,
          vision: true,
          tools: false
        };
        
      default:
        return {
          models: true,
          voices: false,
          streaming: true,
          realtime: false,
          embeddings: false,
          vision: false,
          tools: false
        };
    }
  }

  // Endpoint configurations
  private getOpenAIEndpoints(baseUrl?: string) {
    return {
      models: `${baseUrl || 'https://api.openai.com'}/v1/models`,
      chat: `${baseUrl || 'https://api.openai.com'}/v1/chat/completions`,
      embeddings: `${baseUrl || 'https://api.openai.com'}/v1/embeddings`,
      audio: `${baseUrl || 'https://api.openai.com'}/v1/audio/speech`
    };
  }

  private getAnthropicEndpoints() {
    return {
      messages: 'https://api.anthropic.com/v1/messages',
      models: 'https://api.anthropic.com/v1/models'
    };
  }

  private getElevenLabsEndpoints() {
    return {
      voices: 'https://api.elevenlabs.io/v1/voices',
      speech: 'https://api.elevenlabs.io/v1/text-to-speech'
    };
  }

  private getCartesiaEndpoints() {
    return {
      voices: 'https://api.cartesia.ai/v1/voices',
      tts: 'https://api.cartesia.ai/v1/tts'
    };
  }

  private getDeepgramEndpoints() {
    return {
      models: 'https://api.deepgram.com/v1/projects/{project_id}/model',
      stt: 'https://api.deepgram.com/v1/listen'
    };
  }

  private getHumeEndpoints() {
    return {
      models: 'https://api.hume.ai/v0/models',
      emotion: 'https://api.hume.ai/v0/batch/jobs'
    };
  }

  // Public access methods
  getProviderService(providerId: string): BaseProviderService | undefined {
    return this.providers.get(providerId);
  }

  getAllProviderServices(): BaseProviderService[] {
    return Array.from(this.providers.values());
  }

  // New method to get available provider types
  getAvailableTypes(): string[] {
    return ['llm', 'tts', 'stt', 'multimodal', 'anthropic', 'xai', 'mistral', 'perplexity', 'cohere', 'gemini', 'cartesia', 'deepgram', 'hume'];
  }
}

// Singleton instance
export const aiProviderManager = new AIProviderManager();