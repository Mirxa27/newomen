export interface AIConfiguration {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume';
  provider_name?: string;
  model: string;
  apiKey: string;
  api_base_url?: string;
  api_version?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  isDefault?: boolean;
  custom_headers?: Record<string, string>;
  cost_per_1k_input_tokens?: number;
  cost_per_1k_output_tokens?: number;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost_usd?: number;
  processing_time_ms: number;
  error?: string;
}