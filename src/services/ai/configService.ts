import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { Json, Tables } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';

export interface AIConfiguration {
  id: string;
  name: string;
  description?: string | null;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume' | 'zai';
  provider_name?: string | null;
  model: string;
  apiKey: string | null;
  api_base_url?: string | null;
  api_version?: string | null;
  temperature: number | null;
  maxTokens?: number | null;
  topP?: number | null;
  frequencyPenalty?: number | null;
  presencePenalty?: number | null;
  systemPrompt?: string | null;
  isDefault: boolean;
  custom_headers?: Json | null;
  cost_per_1k_input_tokens?: number | null;
  cost_per_1k_output_tokens?: number | null;
  user_prompt_template?: string | null;
  created_by?: string | null;
  test_status?: string | null;
  last_tested?: string | null;
  is_active?: boolean | null;
}

export class AIConfigService {
  private static instance: AIConfigService;
  private configurations: Map<string, AIConfiguration> = new Map();
  private defaultConfiguration: AIConfiguration | null = null;

  private constructor() {
    void this.loadConfigurations();
  }

  public static getInstance(): AIConfigService {
    if (!AIConfigService.instance) {
      AIConfigService.instance = new AIConfigService();
    }
    return AIConfigService.instance;
  }

  private async loadConfigurations(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*');

      if (error) throw error;

      const configs = data as Tables<'ai_configurations'>[];

      this.configurations.clear();
      configs?.forEach(config => {
        this.configurations.set(config.id, {
          id: config.id,
          name: config.name,
          provider: config.provider as AIConfiguration['provider'],
          provider_name: config.provider_name,
          model: config.model_name,
          apiKey: config.api_key_encrypted,
          api_base_url: config.api_base_url,
          api_version: config.api_version,
          temperature: config.temperature,
          maxTokens: config.max_tokens,
          topP: config.top_p,
          frequencyPenalty: config.frequency_penalty,
          presencePenalty: config.presence_penalty,
          systemPrompt: config.system_prompt,
          isDefault: config.is_default,
          custom_headers: config.custom_headers,
          cost_per_1k_input_tokens: config.cost_per_1k_prompt_tokens,
          cost_per_1k_output_tokens: config.cost_per_1k_completion_tokens,
          user_prompt_template: config.user_prompt_template,
          created_by: config.created_by,
          test_status: config.test_status,
          last_tested: config.last_tested,
          is_active: config.is_active,
          description: config.description,
        });
      });

      const newMeConfig = configs?.find(c => c.name === 'NewMe Voice Agent');
      if (newMeConfig) {
        const baseConfig = this.configurations.get(newMeConfig.id);
        if (baseConfig) {
          this.defaultConfiguration = { ...baseConfig, systemPrompt: newMeConfig.system_prompt || baseConfig.systemPrompt };
        }
      }

      logger.info('AI configurations loaded successfully.');
    } catch (e) {
      logger.error('Failed to load AI configurations:', e as Record<string, unknown>);
    }
  }

  public getConfiguration(id: string): AIConfiguration | undefined {
    return this.configurations.get(id);
  }

  public getDefaultConfiguration(): AIConfiguration | null {
    return this.defaultConfiguration;
  }

  public async getAIConfigForService(serviceType: string, serviceId?: string | null): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_config_for_service', {
        p_service_type: serviceType,
        p_service_id: serviceId,
      });

      if (error) {
        logger.error(`Error fetching AI config for service ${serviceType}:`, error as unknown as Record<string, unknown>);
        return null;
      }

      const configData = data as Tables<'ai_configurations'> | null;
      if (!configData) return this.getDefaultConfiguration();

      return {
        id: configData.id,
        name: configData.name,
        description: configData.description,
        provider: configData.provider as AIConfiguration['provider'],
        provider_name: configData.provider_name,
        model: configData.model_name,
        apiKey: configData.api_key_encrypted,
        api_base_url: configData.api_base_url,
        api_version: configData.api_version,
        temperature: configData.temperature,
        maxTokens: configData.max_tokens,
        topP: configData.top_p,
        frequencyPenalty: configData.frequency_penalty,
        presencePenalty: configData.presence_penalty,
        systemPrompt: configData.system_prompt,
        isDefault: configData.is_default,
        custom_headers: configData.custom_headers,
        cost_per_1k_input_tokens: configData.cost_per_1k_prompt_tokens,
        cost_per_1k_output_tokens: configData.cost_per_1k_completion_tokens,
        user_prompt_template: configData.user_prompt_template,
        created_by: configData.created_by,
        test_status: configData.test_status,
        last_tested: configData.last_tested,
        is_active: configData.is_active,
      };
    } catch (e) {
      logger.error(`Exception fetching AI config for service ${serviceType}:`, e);
      return null;
    }
  }

  public async refreshConfigurations(): Promise<void> {
    await this.loadConfigurations();
  }
}