// Base Provider Service
// Abstract base class for all AI provider integrations

import { supabase } from '@/integrations/supabase/client';
import { 
  AIProvider, 
  AIModel, 
  AIVoice, 
  SyncResult, 
  ProviderTestResult, 
  ProviderAPIResponse,
  ModelListResponse,
  VoiceListResponse,
  ProviderAuth,
  ProviderEndpoints,
  ProviderError,
  RateLimitError,
  AuthenticationError
} from './types';

type DBInsertResult = { data?: unknown; error?: { message?: string } | null };
type UntypedPostgrest = {
  upsert: (rows: unknown, options?: { onConflict?: string; ignoreDuplicates?: boolean }) => Promise<DBInsertResult>;
  insert: (row: unknown) => Promise<DBInsertResult>;
};
type UntypedSupabase = {
  from: (table: string) => UntypedPostgrest;
};

export abstract class BaseProviderService {
  protected provider: AIProvider;
  protected auth: ProviderAuth;
  protected endpoints: ProviderEndpoints;
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor(provider: AIProvider, auth: ProviderAuth, endpoints: ProviderEndpoints) {
    this.provider = provider;
    this.auth = auth;
    this.endpoints = endpoints;
  }

  // Abstract methods to be implemented by specific providers
  abstract discoverModels(): Promise<ModelListResponse>;
  abstract discoverVoices(): Promise<VoiceListResponse>;
  abstract testConnection(): Promise<ProviderTestResult>;
  abstract validateApiKey(apiKey: string): Promise<boolean>;

  // Common functionality
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

      // Discover models if supported
      if (this.provider.capabilities.models) {
        try {
          const modelsResponse = await this.discoverModels();
          modelsDiscovered = modelsResponse.models.length;
          await this.saveModels(modelsResponse.models);
        } catch (error) {
          const errorMsg = `Failed to discover models: ${error instanceof Error ? error.message : error}`;
          errors.push(errorMsg);
          console.error(`[${this.provider.name}]`, errorMsg);
        }
      }

      // Discover voices if supported
      if (this.provider.capabilities.voices) {
        try {
          const voicesResponse = await this.discoverVoices();
          voicesDiscovered = voicesResponse.voices.length;
          await this.saveVoices(voicesResponse.voices);
        } catch (error) {
          const errorMsg = `Failed to discover voices: ${error instanceof Error ? error.message : error}`;
          errors.push(errorMsg);
          console.error(`[${this.provider.name}]`, errorMsg);
        }
      }

      const completedAt = new Date().toISOString();
      const status = errors.length === 0 ? 'success' : (modelsDiscovered > 0 || voicesDiscovered > 0 ? 'partial' : 'failed');

      const result: SyncResult = {
        providerId: this.provider.id,
        syncType: 'full',
        status,
        startedAt,
        completedAt,
        modelsDiscovered,
        voicesDiscovered,
        errors,
        metadata: {
          capabilities: this.provider.capabilities,
          testResult
        }
      };

      await this.saveSyncLog(result);
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);

      const result: SyncResult = {
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
      await this.saveSyncLog(result);
      return result;
    }
  }

  // HTTP client with rate limiting and error handling
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ProviderAPIResponse<T>> {
    // Check rate limits
    await this.checkRateLimit();

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers
    };

    try {
      // Use Supabase Edge Function client to bypass CORS; it adds auth token automatically
      const { data: proxyData, error: proxyError } = await supabase.functions.invoke<{
        success: boolean;
        data?: T;
        error?: string | { message?: string };
        statusCode?: number;
        headers?: Record<string, string>;
      }>(
        'ai-provider-proxy',
        {
          body: {
            // Pass provider id for unambiguous lookup; also include type for header selection
            provider: this.provider.id,
            providerType: this.provider.type,
            endpoint,
            method: options.method || 'GET',
            headers,
            body: options.body
          }
        }
      );

      // Track rate limit
      this.trackRequest();

      if (proxyError) {
        console.error('Edge Function proxy error:', proxyError);
        
        // Check if it's a specific Edge Function error
        if (proxyError.message?.includes('Failed to send a request to the Edge Function')) {
          throw new ProviderError(
            'Edge Function not available. Please ensure the ai-provider-proxy function is deployed and configured correctly.',
            this.provider.id,
            503
          );
        }
        
        throw new ProviderError(`Proxy error: ${proxyError.message}`, this.provider.id, (proxyError as unknown as { status?: number }).status);
      }

      const payload = proxyData || { success: false, error: 'Empty proxy response' };

      // Handle errors from provider
      if (!payload.success) {
        const status = payload.statusCode;
        if (status === 401) {
          throw new AuthenticationError(this.provider.id);
        }
        if (status === 429) {
          throw new RateLimitError(this.provider.id, undefined, this.provider.config.rateLimits);
        }
        const msg = typeof payload.error === 'string' ? payload.error : payload.error?.message || 'Unknown provider error';
        throw new ProviderError(msg, this.provider.id, status);
      }

      return {
        success: true,
        data: payload.data as T,
        statusCode: payload.statusCode,
        headers: payload.headers
      };

    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle CORS errors gracefully
      if (message.includes('CORS') || message.includes('blocked by CORS policy')) {
        throw new ProviderError(
          'CORS policy blocks direct browser requests. This provider requires server-side testing.',
          this.provider.id,
          undefined,
          error as Error
        );
      }
      
      throw new ProviderError(`Request failed: ${message}`, this.provider.id, undefined, error as Error);
    }
  }

  // Rate limiting
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const requests = this.rateLimitTracker.get('requests') || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= this.provider.config.rateLimits.requestsPerMinute) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  private trackRequest(): void {
    const now = Date.now();
    const requests = this.rateLimitTracker.get('requests') || [];
    requests.push(now);
    
    // Keep only recent requests
    const windowMs = 60 * 1000;
    const recentRequests = requests.filter(time => now - time < windowMs);
    this.rateLimitTracker.set('requests', recentRequests);
  }

  // Auth headers
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.auth.type) {
      case 'api_key':
        if (this.auth.apiKey) {
          headers['Authorization'] = `Bearer ${this.auth.apiKey}`;
        }
        break;
      case 'bearer':
        if (this.auth.token) {
          headers['Authorization'] = `Bearer ${this.auth.token}`;
        }
        break;
      case 'custom':
        if (this.auth.headers) {
          Object.assign(headers, this.auth.headers);
        }
        break;
    }

    return headers;
  }

  // Database operations (implemented with Supabase)
  protected async saveModels(models: AIModel[]): Promise<void> {
    if (models.length === 0) return;

    try {
      const rows = models.map((m) => ({
        provider_id: this.provider.id,
        model_id: m.modelId,
        display_name: m.displayName,
        description: m.description ?? null,
        modality: m.modality,
        context_limit: m.contextLimit,
        latency_hint_ms: m.latencyMs ?? null,
        is_realtime: m.isRealtime ?? false,
        enabled: m.enabled,
      }));

      const db = supabase as unknown as UntypedSupabase;
      const { error } = await db
        .from('models')
        .upsert(rows, {
          onConflict: 'provider_id,model_id',
          ignoreDuplicates: false,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save models:', error);
      throw error;
    }
  }

  protected async saveVoices(voices: AIVoice[]): Promise<void> {
    if (voices.length === 0) return;

    try {
      const rows = voices.map((v) => ({
        provider_id: this.provider.id,
        voice_id: v.voiceId,
        name: v.name,
        description: v.description ?? null,
        locale: v.locale,
        gender: v.gender ?? null,
        latency_hint_ms: v.latencyMs ?? null,
        enabled: v.enabled,
      }));

      const db = supabase as unknown as UntypedSupabase;
      const { error } = await db
        .from('voices')
        .upsert(rows, {
          onConflict: 'provider_id,voice_id',
          ignoreDuplicates: false,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save voices:', error);
      throw error;
    }
  }

  protected async saveSyncLog(syncResult: SyncResult): Promise<void> {
    try {
      const db = supabase as unknown as UntypedSupabase;
      const { error } = await db
        .from('provider_sync_logs')
        .insert({
          provider_id: this.provider.id,
          sync_type: syncResult.syncType,
          status: syncResult.status,
          started_at: syncResult.startedAt,
          completed_at: syncResult.completedAt,
          models_discovered: syncResult.modelsDiscovered,
          voices_discovered: syncResult.voicesDiscovered,
          error_message: syncResult.errors?.join('; ') || null,
          metadata: syncResult.metadata || {},
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save sync log:', error);
      // Do not throw; logging errors should not break the main flow
    }
  }

  // Utility methods
  protected buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.provider.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  protected parseError(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const e = error as { message?: string; error?: { message?: string } };
      if (e.message) return e.message;
      if (e.error?.message) return e.error.message;
    }
    return 'Unknown error occurred';
  }

  // Public API
  getProvider(): AIProvider {
    return { ...this.provider };
  }

  getEndpoints(): ProviderEndpoints {
    return { ...this.endpoints };
  }

  updateAuth(auth: ProviderAuth): void {
    this.auth = auth;
  }

  isHealthy(): boolean {
    return this.provider.status === 'active';
  }

  // Public testing methods
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
      const startTime = Date.now();
      
      const response = await this.makeRequest(
        this.endpoints.chat || this.endpoints.completion,
        {
          method: 'POST',
          body: JSON.stringify({
            model: modelId,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 100,
            stream: false
          })
        }
      );

      const responseTime = Date.now() - startTime;

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'API request failed'
        };
      }

      // Extract content and usage from response
      const data = response.data as any;
      const content = data?.choices?.[0]?.message?.content || 
                     data?.choices?.[0]?.text || 
                     'No content returned';
      
      const usage = data?.usage || {};
      const totalTokens = usage.total_tokens || usage.totalTokens || 0;
      
      // Calculate cost (rough estimation)
      const cost = totalTokens * 0.00002; // $0.02 per 1K tokens estimate

      return {
        success: true,
        data: {
          content,
          usage: {
            totalTokens,
            promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
            completionTokens: usage.completion_tokens || usage.completionTokens || 0
          },
          cost
        }
      };

    } catch (error) {
      console.error(`Model test failed for ${modelId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

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
      const startTime = Date.now();
      
      const response = await this.makeRequest(
        this.endpoints.tts,
        {
          method: 'POST',
          body: JSON.stringify({
            text,
            voice: voiceId,
            model: 'eleven_multilingual_v2',
            voice_settings: {
              stability: options.stability || 0.5,
              similarity_boost: options.similarityBoost || 0.5
            }
          })
        }
      );

      const responseTime = Date.now() - startTime;

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Voice synthesis failed'
        };
      }

      // Extract audio data from response
      const data = response.data as any;
      const audioData = data?.audio || data?.audio_base64;
      let audioUrl: string | undefined;
      
      if (audioData) {
        // Convert base64 to blob URL if needed
        if (typeof audioData === 'string' && audioData.startsWith('data:')) {
          audioUrl = audioData;
        } else if (typeof audioData === 'string') {
          // Assume it's base64 encoded
          audioUrl = `data:audio/mpeg;base64,${audioData}`;
        }
      }

      return {
        success: true,
        data: {
          audioUrl,
          audioLength: responseTime,
          quality: 0.8 // Default quality score
        }
      };

    } catch (error) {
      console.error(`Voice test failed for ${voiceId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
