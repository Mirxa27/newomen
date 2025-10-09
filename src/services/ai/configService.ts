import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { Tables } from '@/integrations/supabase/types';

export interface AIConfiguration {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  provider_name: string;
  model: string;
  apiKey: string | null;
  api_base_url: string | null;
  api_version: string | null;
  temperature: number | null;
  maxTokens: number | null;
  topP: number | null;
  frequencyPenalty: number | null;
  presencePenalty: number | null;
  systemPrompt: string | null;
  isDefault: boolean | null;
  custom_headers: Record<string, string> | null;
  cost_per_1k_input_tokens: number | null;
  cost_per_1k_output_tokens: number | null;
  user_prompt_template: string | null;
  created_by: string | null;
  test_status: string | null;
  last_tested: string | null;
  is_active: boolean;
  description: string | null;
}

export class AIConfigService {
  private static instance: AIConfigService;
  private configurations: Map<string, AIConfiguration> = new Map();

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
      const { data, error } = await supabase.from('ai_configurations').select('*');
      if (error) throw error;

      this.configurations.clear();
      (data as Tables<'ai_configurations'>[]).forEach(config => {
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
          custom_headers: config.custom_headers as Record<string, string> | null,
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
      logger.info('AI configurations loaded successfully.');
    } catch (e) {
      logger.error('Failed to load AI configurations:', e);
    }
  }

  public getConfiguration(id: string): AIConfiguration | undefined {
    return this.configurations.get(id);
  }

  public async getAIConfigForService(serviceType: string, serviceId?: string): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_config_for_service', {
        service_type_param: serviceType,
        service_id_param: serviceId,
      });

      if (error) {
        logger.error(`Error fetching AI config for ${serviceType}:`, error);
        return null;
      }
      return data as AIConfiguration | null;
    } catch (e) {
      logger.error(`Exception fetching AI config for ${serviceType}:`, e);
      return null;
    }
  }
}