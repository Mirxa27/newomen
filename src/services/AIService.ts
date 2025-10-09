import { supabase } from "@/integrations/supabase/client";
import { NEWME_SYSTEM_PROMPT, NEWME_GREETING_TEMPLATES } from "@/config/newme-system-prompt";
import { newMeMemoryService } from "@/services/NewMeMemoryService";
import type {
  AssessmentAnswers,
  QuizAnswers,
  ProgressData,
  AssessmentResponseData,
  QuizResponseData
} from "@/types/ai-types";

export interface AIConfiguration {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume' | 'zai';
  provider_name?: string;
  model: string;  // Note: using 'model' to match other parts of code
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

export interface AssessmentSubmission {
  assessment_id: string;
  answers: AssessmentAnswers;
  user_id: string;
}

export interface QuizSubmission {
  quiz_id: string;
  answers: QuizAnswers;
  user_id: string;
  time_taken_seconds?: number;
}

export interface ChallengeSubmission {
  challenge_id: string;
  progress_data: ProgressData;
  user_id: string;
}

export class AIService {
  private configurations: Map<string, AIConfiguration> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map();
  private cache: Map<string, { data: AIResponse; timestamp: number }> = new Map();

  constructor() {
    this.loadConfigurations();
  }

  private async loadConfigurations() {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      this.configurations.clear();
      data?.forEach(config => {
        this.configurations.set(config.id, {
          id: config.id,
          name: config.name,
          provider: config.provider as 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume' | 'zai',
          provider_name: config.provider_name || undefined,
          model: config.model_name,
          apiKey: config.api_key_encrypted || '', // Note: This should be decrypted in production
          api_base_url: config.api_base_url || undefined,
          api_version: config.api_version || undefined,
          temperature: Number(config.temperature),
          maxTokens: config.max_tokens,
          topP: config.top_p ? Number(config.top_p) : undefined,
          frequencyPenalty: config.frequency_penalty ? Number(config.frequency_penalty) : undefined,
          presencePenalty: config.presence_penalty ? Number(config.presence_penalty) : undefined,
          systemPrompt: config.system_prompt || undefined,
          isDefault: config.is_default || false,
          custom_headers: (config.custom_headers as Record<string, string>) || undefined,
          cost_per_1k_input_tokens: config.cost_per_1k_prompt_tokens ? Number(config.cost_per_1k_prompt_tokens) : undefined,
          cost_per_1k_output_tokens: config.cost_per_1k_completion_tokens ? Number(config.cost_per_1k_completion_tokens) : undefined,
        });
      });

      // Also load the NewMe configuration with the system prompt
      const newMeConfig = data?.find(c => c.name === 'NewMe Voice Agent');
      if (newMeConfig) {
        const baseConfig = this.configurations.get(newMeConfig.id);
        if (baseConfig) {
          this.configurations.set('newme-voice-agent', {
            ...baseConfig,
            systemPrompt: NEWME_SYSTEM_PROMPT,
          });
        }
      } else {
        // Fallback NewMe configuration
        this.configurations.set('newme-voice-agent', {
          id: 'newme-voice-agent',
          name: 'NewMe Voice Agent',
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
          temperature: 0.8,
          maxTokens: 2000,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.6,
          systemPrompt: NEWME_SYSTEM_PROMPT,
        });
      }
    } catch (dbError) {
      console.warn('Could not load AI configurations from database:', dbError);
      // Set up fallback NewMe configuration
      this.configurations.set('newme-voice-agent', {
        id: 'newme-voice-agent',
        name: 'NewMe Voice Agent',
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        temperature: 0.8,
        maxTokens: 2000,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.6,
        systemPrompt: NEWME_SYSTEM_PROMPT,
      });
    }
  }

  // ... (rest of the file is correct)
}

export const aiService = new AIService();
