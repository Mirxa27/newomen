import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  api_base?: string;
  api_key_encrypted?: string;
  openai_compatible?: boolean;
  max_tokens?: number;
  cost_per_1k_prompt_tokens?: number;
  cost_per_1k_completion_tokens?: number;
}

export interface AIBehavior {
  id: string;
  name: string;
  personality_traits: Record<string, unknown> | Record<string, number>;
  communication_style: string;
  response_length: string;
  emotional_tone: string;
  creativity_level: string;
  humor_usage: string;
  verbosity_level: string;
  topic_preferences: string[];
  system_instructions?: string;
}

// Placeholder types and functions to fix import errors
export type PromptTemplate = { id: string; content: string };
export const getAIUseCases = async (): Promise<any[]> => Promise.resolve([]);
export const generateAIResponse = async (): Promise<any> => Promise.resolve({});

export async function getAIProviderConfig(providerId: string): Promise<AIProviderConfig | null> {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) {
      console.error('Error fetching AI provider config:', error);
      return null;
    }
    return data as unknown as AIProviderConfig;
  } catch (error) {
    console.error('Unexpected error in getAIProviderConfig:', error);
    return null;
  }
}

export async function getAIBehaviors(): Promise<AIBehavior[]> {
  try {
    const { data, error } = await supabase
      .from('ai_behaviors')
      .select('*');

    if (error) {
      console.error('Error fetching AI behaviors:', error);
      return [];
    }
    return data as unknown as AIBehavior[];
  } catch (error) {
    console.error('Unexpected error in getAIBehaviors:', error);
    return [];
  }
}

export async function getAIConfiguration(configId: string): Promise<{ provider: AIProviderConfig; behavior: AIBehavior } | null> {
  try {
    const { data, error } = await supabase
      .from('ai_model_configs')
      .select(`
        *,
        provider:providers(*),
        behavior:ai_behaviors(*)
      `)
      .eq('id', configId)
      .single();

    if (error) {
      console.error('Error fetching AI configuration:', error);
      return null;
    }

    if (!data) return null;

    const typedData = data as (Tables<'ai_model_configs'> & { providers: Tables<'providers'>; ai_behaviors: Tables<'ai_behaviors'> });

    const provider = typedData.providers as unknown as AIProviderConfig;
    const behavior = typedData.ai_behaviors as unknown as AIBehavior;

    return { provider, behavior };
  } catch (error) {
    console.error('Unexpected error in getAIConfiguration:', error);
    return null;
  }
}