-- Drop and recreate get_ai_config_for_service function with all necessary fields

DROP FUNCTION IF EXISTS get_ai_config_for_service(TEXT, UUID);

CREATE OR REPLACE FUNCTION get_ai_config_for_service(
  service_type_param TEXT,
  service_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  config_id UUID,
  config_name TEXT,
  provider TEXT,
  model_name TEXT,
  api_base_url TEXT,
  api_version TEXT,
  temperature DECIMAL,
  max_tokens INTEGER,
  top_p DECIMAL,
  frequency_penalty DECIMAL,
  presence_penalty DECIMAL,
  system_prompt TEXT,
  user_prompt_template TEXT,
  custom_headers JSONB,
  is_default BOOLEAN,
  provider_name TEXT,
  cost_per_1k_input_tokens DECIMAL,
  cost_per_1k_output_tokens DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.name,
    ac.provider,
    ac.model_name,
    ac.api_base_url,
    ac.api_version,
    COALESCE(sc.temperature_override, ac.temperature),
    COALESCE(sc.max_tokens_override, ac.max_tokens),
    ac.top_p,
    ac.frequency_penalty,
    ac.presence_penalty,
    COALESCE(sc.system_prompt_override, ac.system_prompt),
    COALESCE(sc.user_prompt_template_override, ac.user_prompt_template),
    ac.custom_headers,
    ac.is_default,
    ac.provider_name,
    ac.cost_per_1k_input_tokens,
    ac.cost_per_1k_output_tokens
  FROM ai_service_configs sc
  JOIN ai_configurations ac ON ac.id = sc.ai_configuration_id
  WHERE sc.service_type = service_type_param
    AND (service_id_param IS NULL OR sc.service_id = service_id_param)
    AND sc.is_active = true
    AND ac.is_active = true
  ORDER BY
    sc.priority DESC,
    sc.is_fallback ASC
  LIMIT 1;
END;
$function$;