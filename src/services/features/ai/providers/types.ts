// AI Provider Service Types
// Unified types for AI provider integration and auto-discovery

export interface AIProvider {
  id: string;
  name: string;
  type: 'llm' | 'tts' | 'stt' | 'multimodal';
  baseUrl: string;
  apiKey?: string;
  status: 'active' | 'inactive' | 'error';
  lastSynced?: string;
  capabilities: ProviderCapabilities;
  config: ProviderConfig;
}

export interface ProviderCapabilities {
  models: boolean;
  voices: boolean;
  streaming: boolean;
  realtime: boolean;
  embeddings: boolean;
  vision: boolean;
  tools: boolean;
}

export interface ProviderConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  systemInstructions?: string;
  rateLimits: RateLimits;
}

export interface RateLimits {
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay?: number;
}

export interface AIModel {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string;
  description?: string;
  modality: 'text' | 'multimodal' | 'embedding' | 'audio' | 'image';
  contextLimit: number;
  inputPricing?: ModelPricing;
  outputPricing?: ModelPricing;
  latencyMs?: number;
  capabilities: ModelCapabilities;
  isRealtime?: boolean;
  enabled: boolean;
}

export interface ModelCapabilities {
  chat: boolean;
  completion: boolean;
  streaming: boolean;
  vision: boolean;
  tools: boolean;
  json: boolean;
}

export interface ModelPricing {
  perToken: number;
  per1kTokens: number;
  currency: string;
}

export interface AIVoice {
  id: string;
  providerId: string;
  voiceId: string;
  name: string;
  description?: string;
  gender?: 'male' | 'female' | 'neutral';
  locale: string;
  language: string;
  accent?: string;
  age?: 'young' | 'adult' | 'elderly';
  style?: string[];
  sampleUrl?: string;
  latencyMs?: number;
  pricing?: VoicePricing;
  enabled: boolean;
}

export interface VoicePricing {
  perCharacter: number;
  perSecond: number;
  currency: string;
}

export interface SyncResult {
  providerId: string;
  syncType: 'models' | 'voices' | 'full' | 'test';
  status: 'success' | 'failed' | 'partial';
  startedAt: string;
  completedAt: string;
  modelsDiscovered: number;
  voicesDiscovered: number;
  errors: string[];
  metadata: Record<string, unknown>;
}

export interface ProviderTestResult {
  providerId: string;
  endpoint: string;
  statusCode?: number;
  responseTime: number;
  isHealthy: boolean;
  error?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface APIUsage {
  providerId: string;
  serviceType: string;
  modelName?: string;
  tokensUsed: number;
  requestsCount: number;
  costUsd: number;
  userId?: string;
  sessionId?: string;
  usageDate: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderAuth {
  type: 'api_key' | 'oauth' | 'bearer' | 'custom';
  apiKey?: string;
  token?: string;
  credentials?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface ProviderEndpoints {
  models: string;
  voices?: string;
  chat?: string;
  completion?: string;
  embedding?: string;
  tts?: string;
  stt?: string;
  health?: string;
}

// Provider-specific configurations
export interface OpenAIConfig extends ProviderConfig {
  organization?: string;
  project?: string;
}

export interface AnthropicConfig extends ProviderConfig {
  version: string;
}

export interface ElevenLabsConfig extends ProviderConfig {
  voiceSettings: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

export interface GoogleConfig extends ProviderConfig {
  projectId?: string;
  location?: string;
}

export interface HumeConfig extends ProviderConfig {
  prosody: {
    granularity?: string;
    identify_speakers?: boolean;
  };
}

// API Response types
export interface ProviderAPIResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface ModelListResponse {
  models: AIModel[];
  total: number;
  hasMore?: boolean;
  nextCursor?: string;
}

export interface VoiceListResponse {
  voices: AIVoice[];
  total: number;
  hasMore?: boolean;
  nextCursor?: string;
}

// Error types
export class ProviderError extends Error {
  constructor(
    message: string,
    public providerId: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(
    providerId: string,
    public retryAfter?: number,
    public limit?: RateLimits
  ) {
    super(`Rate limit exceeded for provider ${providerId}`, providerId, 429);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends ProviderError {
  constructor(providerId: string) {
    super(`Authentication failed for provider ${providerId}`, providerId, 401);
    this.name = 'AuthenticationError';
  }
}
