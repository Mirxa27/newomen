-- Complete Provider Discovery Setup (Simplified - No Database Parameters)
-- This script sets up all necessary components for AI provider management without requiring database parameter changes

-- 1. Create providers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  api_base TEXT,
  region TEXT,
  status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create models table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  modality TEXT,
  context_limit INTEGER,
  latency_hint_ms INTEGER,
  is_realtime BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, model_id)
);

-- 3. Create voices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  locale TEXT,
  gender TEXT,
  latency_hint_ms INTEGER,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, voice_id)
);

-- 4. Create simple API key storage table (without encryption for now)
CREATE TABLE IF NOT EXISTS public.provider_api_keys (
  provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enable RLS on all tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_api_keys ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for providers
DROP POLICY IF EXISTS "Admins manage providers" ON public.providers;
CREATE POLICY "Admins manage providers"
  ON public.providers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Create RLS policies for models
DROP POLICY IF EXISTS "Admins manage models" ON public.models;
CREATE POLICY "Admins manage models"
  ON public.models
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Create RLS policies for voices
DROP POLICY IF EXISTS "Admins manage voices" ON public.voices;
CREATE POLICY "Admins manage voices"
  ON public.voices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Create RLS policies for provider API keys
DROP POLICY IF EXISTS "Admins manage provider API keys" ON public.provider_api_keys;
CREATE POLICY "Admins manage provider API keys"
  ON public.provider_api_keys
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create update triggers
DROP TRIGGER IF EXISTS update_providers_updated_at ON public.providers;
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_models_updated_at ON public.models;
CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_voices_updated_at ON public.voices;
CREATE TRIGGER update_voices_updated_at
  BEFORE UPDATE ON public.voices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_provider_api_keys_updated_at ON public.provider_api_keys;
CREATE TRIGGER update_provider_api_keys_updated_at
  BEFORE UPDATE ON public.provider_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Create simplified RPC functions (without encryption)
CREATE OR REPLACE FUNCTION public.store_provider_api_key(p_provider_id uuid, p_api_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  INSERT INTO public.provider_api_keys(provider_id, api_key)
  VALUES (p_provider_id, p_api_key)
  ON CONFLICT (provider_id)
  DO UPDATE
  SET api_key = EXCLUDED.api_key,
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_provider_api_key(p_provider_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  SELECT api_key
    INTO v_api_key
    FROM public.provider_api_keys
    WHERE provider_id = p_provider_id;

  RETURN v_api_key;
END;
$$;

-- 13. Grant permissions
REVOKE ALL ON FUNCTION public.store_provider_api_key(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_provider_api_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO service_role;

-- 14. Grant table permissions
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.models TO authenticated;
GRANT ALL ON public.voices TO authenticated;
GRANT ALL ON public.provider_api_keys TO authenticated;

-- 15. Create some sample providers for testing
INSERT INTO public.providers (name, type, api_base, status) VALUES
  ('OpenAI', 'openai', 'https://api.openai.com/v1', 'active'),
  ('Anthropic', 'anthropic', 'https://api.anthropic.com/v1', 'active'),
  ('Google Gemini', 'gemini', 'https://generativelanguage.googleapis.com/v1beta', 'active')
ON CONFLICT (name) DO NOTHING;

-- 16. Create some sample models for testing
INSERT INTO public.models (provider_id, model_id, display_name, modality, context_limit, enabled) 
SELECT 
  p.id,
  'gpt-4',
  'GPT-4',
  'text',
  128000,
  true
FROM public.providers p 
WHERE p.name = 'OpenAI' AND p.type = 'openai'
ON CONFLICT (provider_id, model_id) DO NOTHING;

INSERT INTO public.models (provider_id, model_id, display_name, modality, context_limit, enabled) 
SELECT 
  p.id,
  'gpt-3.5-turbo',
  'GPT-3.5 Turbo',
  'text',
  16000,
  true
FROM public.providers p 
WHERE p.name = 'OpenAI' AND p.type = 'openai'
ON CONFLICT (provider_id, model_id) DO NOTHING;

INSERT INTO public.models (provider_id, model_id, display_name, modality, context_limit, enabled) 
SELECT 
  p.id,
  'claude-3-sonnet-20240229',
  'Claude 3 Sonnet',
  'text',
  200000,
  true
FROM public.providers p 
WHERE p.name = 'Anthropic' AND p.type = 'anthropic'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- 17. Verify the setup
SELECT 'Provider setup completed successfully (simplified version)' as status;
