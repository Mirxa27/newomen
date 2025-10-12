import { supabase } from "@/integrations/supabase/client";
import type { AIConfiguration } from './aiTypes';
import { NEWME_SYSTEM_PROMPT } from "@/config/newme-system-prompt";

class ConfigService {
  private configurations: Map<string, AIConfiguration> = new Map();

  constructor() {
    this.loadConfigurations();
  }

  async loadConfigurations() {
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
          provider: config.provider as AIConfiguration['provider'],
          provider_name: config.provider_name || undefined,
          model: config.model_name,
          apiKey: config.api_key_encrypted || '',
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

      const newMeConfig = data?.find(c => c.name === 'NewMe Voice Agent');
      if (newMeConfig) {
        const baseConfig = this.configurations.get(newMeConfig.id);
        if (baseConfig) {
          this.configurations.set('newme-voice-agent', { ...baseConfig, systemPrompt: NEWME_SYSTEM_PROMPT });
        }
      }
    } catch (dbError) {
      console.warn('Could not load AI configurations from database:', dbError);
    }
  }

  async getConfigurationForService(serviceType: string, serviceId?: string): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_config_for_service', {
        p_service_type: serviceType,
        p_service_id: serviceId || null
      });

      if (error) {
        console.warn(`Error getting config for ${serviceType}:`, error);
        return this.getDefaultConfiguration();
      }

      const configData = Array.isArray(data) ? data[0] : data;
      if (!configData) return this.getDefaultConfiguration();

      const config: AIConfiguration = {
        id: configData.config_id,
        name: configData.config_name,
        provider: configData.provider,
        model: configData.model_name,
        apiKey: '',
        temperature: Number(configData.temperature),
        maxTokens: configData.max_tokens,
        topP: configData.top_p ? Number(configData.top_p) : undefined,
        frequencyPenalty: configData.frequency_penalty ? Number(configData.frequency_penalty) : undefined,
        presencePenalty: configData.presence_penalty ? Number(configData.presence_penalty) : undefined,
        systemPrompt: configData.system_prompt || undefined,
        isDefault: configData.is_default || false,
        provider_name: configData.provider_name || undefined,
        api_base_url: configData.api_base_url || undefined,
        api_version: configData.api_version || undefined,
        custom_headers: (configData.custom_headers as Record<string, string>) || undefined,
        cost_per_1k_input_tokens: configData.cost_per_1k_input_tokens ? Number(configData.cost_per_1k_input_tokens) : undefined,
        cost_per_1k_output_tokens: configData.cost_per_1k_output_tokens ? Number(configData.cost_per_1k_output_tokens) : undefined
      };

      const storedConfig = Array.from(this.configurations.values()).find(c => c.id === config.id);
      if (storedConfig) config.apiKey = storedConfig.apiKey;

      return config;
    } catch (error) {
      console.error(`Error in getConfigurationForService(${serviceType}):`, error);
      return this.getDefaultConfiguration();
    }
  }

  getDefaultConfiguration(): AIConfiguration | null {
    for (const config of this.configurations.values()) {
      if (config.id === 'newme' || config.isDefault) return config;
    }
    return Array.from(this.configurations.values())[0] || null;
  }

  getConfigurations(): AIConfiguration[] {
    return Array.from(this.configurations.values());
  }

  getConfiguration(id: string): AIConfiguration | null {
    return this.configurations.get(id) || null;
  }
}

export const configService = new ConfigService();