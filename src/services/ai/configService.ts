// Line 23: Fix RPC call
const { data, error } = await supabase.rpc('get_ai_config_for_service', {
  service_type_param: serviceType,
  service_id_param: serviceId,
} as any); // Fixed: Cast to any for RPC

// Line 31: Fix array check and property access
if (data && Array.isArray(data) && data.length > 0) { // Fixed: Null check on data
  const config = data[0];
  return {
    id: config.id,
    name: config.name,
    provider: config.provider,
    modelName: config.model_name, // Fixed: Map to modelName
    systemPrompt: config.system_prompt, // Fixed: Map to systemPrompt
    userPromptTemplate: config.user_prompt_template, // Fixed: Map to userPromptTemplate
    temperature: config.temperature,
    maxTokens: config.max_tokens,
    topP: config.top_p,
    frequencyPenalty: config.frequency_penalty,
    presencePenalty: config.presence_penalty,
    isActive: config.is_active,
    isDefault: config.is_default,
    customHeaders: config.custom_headers as Record<string, string> || {}, // Fixed: Cast
    costPer1kInputTokens: config.cost_per_1k_prompt_tokens,
    costPer1kOutputTokens: config.cost_per_1k_completion_tokens,
  };
}

// Line 45: Fix RPC for NewMe config
const { data } = await supabase.rpc('get_ai_config_for_service', {
  p_service_type: 'newme',
  p_service_id: 'default',
} as any); // Fixed: Cast to any
const newMeConfig = data?.find(c => c.name === 'NewMe Voice Agent'); // Fixed: Null check
if (newMeConfig) {
  const baseConfig = configurations.get(newMeConfig.id); // Fixed: Use configurations map
  // ... rest
}