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
    'hume'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Refresh the type cache, just in case
ALTER TYPE public.ai_provider_type REFRESH;

-- Step 2: Remove any existing default value from the column
ALTER TABLE public.ai_configurations ALTER COLUMN provider DROP DEFAULT;

-- Step 3: Alter the column type
-- This step will convert existing 'text' values to 'ai_provider_type'
ALTER TABLE public.ai_configurations ALTER COLUMN provider TYPE public.ai_provider_type USING provider::public.ai_provider_type;

-- Step 4: Add the default value back, explicitly cast
ALTER TABLE public.ai_configurations ALTER COLUMN provider SET DEFAULT 'openai'::public.ai_provider_type;

-- Insert default configurations for new AI providers
INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
) VALUES (
  'Google Gemini 1.5 Pro', 'google', 'Google', 'gemini-1.5-pro', 'https://generativelanguage.googleapis.com/v1beta', 0.7, 4000, TRUE, FALSE,
  0.0035, 0.0105, 'You are a helpful and creative assistant powered by Google Gemini.'
) ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
) VALUES (
  'ElevenLabs TTS', 'elevenlabs', 'ElevenLabs', 'eleven_multilingual_v2', 'https://api.elevenlabs.io/v1', 0.7, 500, TRUE, FALSE,
  0.000018, 0.000018, 'You are a text-to-speech service. Convert text to natural-sounding speech.'
) ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
) VALUES (
  'Cartesia Voice Agent', 'cartesia', 'Cartesia', 'cartesia-voice-v1', 'https://api.cartesia.ai', 0.7, 1000, TRUE, FALSE,
  0.005, 0.015, 'You are a real-time voice AI powered by Cartesia.'
) ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
) VALUES (
  'Deepgram ASR', 'deepgram', 'Deepgram', 'nova-2', 'https://api.deepgram.com/v1', 0.0, 0, TRUE, FALSE,
  0.000022, 0.000022, 'You are a highly accurate speech-to-text service.'
) ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ai_configurations (
  name, provider, provider_name, model_name, api_base_url, temperature, max_tokens, is_active, is_default,
  cost_per_1k_prompt_tokens, cost_per_1k_completion_tokens, system_prompt
) VALUES (
  'Hume AI Empathic Voice', 'hume', 'Hume AI', 'empathic-voice-v1', 'https://api.hume.ai', 0.7, 1000, TRUE, FALSE,
  0.008, 0.024, 'You are an AI focused on understanding and responding with emotional intelligence.'
) ON CONFLICT (name) DO NOTHING;