import { supabase } from "@/integrations/supabase/client";

export interface AIProviderConfig {
  id: string;
  name: string;
  type: string;
  api_base: string;
  openai_compatible: boolean;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_instructions?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  system_prompt: string;
  user_prompt_template?: string;
  variables?: Record<string, unknown>;
  temperature: number;
  max_tokens: number;
  use_case: {
    id: string;
    name: string;
    category: string;
  };
}

export interface AIBehavior {
  id: string;
  name: string;
  personality_traits: Record<string, number> | Record<string, unknown>;
  communication_style: string;
  response_length: string;
  emotional_tone: string;
}

/**
 * Get the best AI provider configuration for a specific use case
 */
export async function getAIProviderForUseCase(useCaseId: string): Promise<AIProviderConfig | null> {
  try {
    const { data, error } = await supabase
      .from("ai_model_configs")
      .select(`
        *,
        provider:providers(*),
        use_case:ai_use_cases(*)
      `)
      .eq("use_case_id", useCaseId)
      .eq("is_active", true)
      .eq("is_primary", true)
      .order("priority", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching AI provider:", error);
      return null;
    }

    return data?.provider as AIProviderConfig;
  } catch (error) {
    console.error("Error in getAIProviderForUseCase:", error);
    return null;
  }
}

/**
 * Get prompt template for a specific use case and provider
 */
export async function getPromptTemplate(useCaseId: string, providerId?: string): Promise<PromptTemplate | null> {
  try {
    let query = supabase
      .from("prompt_templates")
      .select(`
        *,
        use_case:ai_use_cases(*)
      `)
      .eq("use_case_id", useCaseId)
      .eq("is_active", true);

    if (providerId) {
      query = query.eq("provider_id", providerId);
    }

    const { data, error } = await query
      .order("is_default", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching prompt template:", error);
      return null;
    }

    return data as PromptTemplate;
  } catch (error) {
    console.error("Error in getPromptTemplate:", error);
    return null;
  }
}

/**
 * Get AI behavior configuration
 */
export async function getAIBehavior(behaviorId: string): Promise<AIBehavior | null> {
  try {
    const { data, error } = await supabase
      .from("ai_behaviors")
      .select("*")
      .eq("id", behaviorId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching AI behavior:", error);
      return null;
    }

    return data as AIBehavior;
  } catch (error) {
    console.error("Error in getAIBehavior:", error);
    return null;
  }
}

/**
 * Apply prompt template with variables
 */
export function applyPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, unknown>
): { systemPrompt: string; userPrompt: string } {
  let systemPrompt = template.system_prompt;
  let userPrompt = template.user_prompt_template || "";

  // Replace variables in system prompt
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), String(value));
    userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), String(value));
  });

  return { systemPrompt, userPrompt };
}

/**
 * Get AI configuration for a specific use case
 */
export async function getAIConfiguration(useCaseId: string): Promise<{
  provider: AIProviderConfig;
  template: PromptTemplate;
  behavior?: AIBehavior;
} | null> {
  try {
    const { data, error } = await supabase
      .from("ai_model_configs")
      .select(`
        *,
        provider:providers(*),
        use_case:ai_use_cases(*),
        behavior:ai_behaviors(*)
      `)
      .eq("use_case_id", useCaseId)
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching AI configuration:", error);
      return null;
    }

    const provider = data?.provider as AIProviderConfig;
    const behavior = data?.behavior as AIBehavior;

    // Get the prompt template
    const template = await getPromptTemplate(useCaseId, provider?.id);

    if (!provider || !template) {
      return null;
    }

    return {
      provider,
      template,
      behavior
    };
  } catch (error) {
    console.error("Error in getAIConfiguration:", error);
    return null;
  }
}

/**
 * Generate AI response using the configured provider and template
 */
export async function generateAIResponse(
  useCaseId: string,
  userMessage: string,
  variables: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    const config = await getAIConfiguration(useCaseId);
    if (!config) {
      throw new Error("No AI configuration found for this use case");
    }

    const { systemPrompt, userPrompt } = applyPromptTemplate(config.template, {
      ...variables,
      user_message: userMessage
    });

    // For OpenAI-compatible providers
    if (config.provider.openai_compatible) {
      const response = await fetch(`${config.provider.api_base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // This should be stored securely
        },
        body: JSON.stringify({
          model: "gpt-4", // This should be configurable
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: config.template.max_tokens,
          temperature: config.template.temperature,
          top_p: config.provider.top_p,
          frequency_penalty: config.provider.frequency_penalty,
          presence_penalty: config.provider.presence_penalty
        })
      });

      if (!response.ok) {
        throw new Error(`AI provider error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || null;
    }

    // For other providers, implement custom logic here
    throw new Error("Non-OpenAI providers not yet implemented");
  } catch (error) {
    console.error("Error generating AI response:", error);
    return null;
  }
}

/**
 * Get all available use cases
 */
export async function getAIUseCases(): Promise<Array<{ id: string; name: string; category: string }>> {
  try {
    const { data, error } = await supabase
      .from("ai_use_cases")
      .select("id, name, category")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching AI use cases:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAIUseCases:", error);
    return [];
  }
}

/**
 * Get all available AI behaviors
 */
export async function getAIBehaviors(): Promise<AIBehavior[]> {
  try {
    const { data, error } = await supabase
      .from("ai_behaviors")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching AI behaviors:", error);
      return [];
    }

    return (data || []).map(behavior => ({
      ...behavior,
      personality_traits: behavior.personality_traits as Record<string, number>
    }));
  } catch (error) {
    console.error("Error in getAIBehaviors:", error);
    return [];
  }
}
