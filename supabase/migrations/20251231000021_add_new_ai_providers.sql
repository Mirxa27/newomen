-- Add default configurations for new AI providers

-- Step 1: Create the enum type (already handled by the DO block)
DO $$ BEGIN
  CREATE TYPE public.ai_provider_type AS ENUM (
    'openai',
    'anthropic',
    'google',
    'azure',
    'custom',
    'elevenlabs',
    'cartesia',
    'deepgram',
    'hume',
    'zai'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Remove any existing default value from the column
ALTER TABLE public.ai_configurations ALTER COLUMN provider DROP DEFAULT;

-- Normalize existing provider values
UPDATE public.ai_configurations
SET provider = 'custom'
WHERE provider NOT IN (
  'openai',
  'anthropic',
  'google',
  'azure',
  'custom',
  'elevenlabs',
  'cartesia',
  'deepgram',
  'hume',
  'zai'
);

-- Step 3: Restore default value
ALTER TABLE public.ai_configurations ALTER COLUMN provider SET DEFAULT 'openai';

-- Insert default configurations for new AI providers
INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
)
SELECT
  'Google Gemini 1.5 Pro', 'google', 'Google', 'gemini-1.5-pro', 'https://generativelanguage.googleapis.com/v1beta', 0.7, 4000, TRUE, FALSE,
  0.0035, 0.0105, 'You are a helpful and creative assistant powered by Google Gemini.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_configurations WHERE name = 'Google Gemini 1.5 Pro'
);

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
)
SELECT
  'ElevenLabs TTS', 'elevenlabs', 'ElevenLabs', 'eleven_multilingual_v2', 'https://api.elevenlabs.io/v1', 0.7, 500, TRUE, FALSE,
  0.000018, 0.000018, 'You are a text-to-speech service. Convert text to natural-sounding speech.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_configurations WHERE name = 'ElevenLabs TTS'
);

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
)
SELECT
  'Cartesia Voice Agent', 'cartesia', 'Cartesia', 'cartesia-voice-v1', 'https://api.cartesia.ai', 0.7, 1000, TRUE, FALSE,
  0.005, 0.015, 'You are a real-time voice AI powered by Cartesia.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_configurations WHERE name = 'Cartesia Voice Agent'
);

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
)
SELECT
  'Deepgram ASR', 'deepgram', 'Deepgram', 'nova-2', 'https://api.deepgram.com/v1', 0.0, 0, TRUE, FALSE,
  0.000022, 0.000022, 'You are a highly accurate speech-to-text service.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_configurations WHERE name = 'Deepgram ASR'
);

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
)
SELECT
  'Hume AI Empathic Voice', 'hume', 'Hume AI', 'empathic-voice-v1', 'https://api.hume.ai', 0.7, 1000, TRUE, FALSE,
  0.008, 0.024, 'You are an AI focused on understanding and responding with emotional intelligence.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_configurations WHERE name = 'Hume AI Empathic Voice'
);

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
)
SELECT
  'Z.ai Insight Engine', 'zai', 'Z.ai', 'zai-insight-pro', 'https://api.zai.ai/v1', 0.65, 1800, TRUE, FALSE,
  0.002, 0.006, 'You are Z.ai, an expert assessment architect who crafts evidence-based insights for personal growth. Always return structured JSON when requested.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_configurations WHERE name = 'Z.ai Insight Engine'
);

-- Ensure Z.ai provider and model entries exist in provider directories
INSERT INTO public.providers (name, type, api_base, status)
SELECT 'Z.ai', 'zai', 'https://api.zai.ai', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.providers WHERE type = 'zai'
);

INSERT INTO public.models (provider_id, model_id, display_name, modality, enabled)
SELECT p.id, 'zai-insight-pro', 'Z.ai Insight Pro', 'text', TRUE
FROM public.providers p
WHERE p.type = 'zai'
  AND NOT EXISTS (
    SELECT 1 FROM public.models WHERE model_id = 'zai-insight-pro'
  );
