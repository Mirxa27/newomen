-- Fix Migration Conflicts
-- This script handles conflicts in existing data

-- 1. Fix AI use cases conflicts by using ON CONFLICT
INSERT INTO public.ai_use_cases (name, description, category) VALUES
('Assessment Completion', 'AI responses for completed assessments and personality tests', 'assessment'),
('Couples Challenge', 'AI analysis and guidance for couples challenges', 'challenge'),
('Narrative Exploration', 'AI guidance for narrative identity exploration', 'conversation'),
('Wellness Guidance', 'AI wellness advice and meditation guidance', 'wellness'),
('Community Moderation', 'AI moderation for community discussions', 'moderation'),
('General Chat', 'General conversational AI interactions', 'conversation'),
('Assessment Analysis', 'AI analysis of assessment results and patterns', 'analysis'),
('Goal Setting', 'AI assistance with personal goal setting and tracking', 'coaching'),
('Relationship Advice', 'AI relationship and communication guidance', 'advice'),
('Crisis Support', 'AI support for users in crisis situations', 'support')
ON CONFLICT (name) DO NOTHING;

-- 2. Ensure provider tables exist with correct structure
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

-- 3. Create models table if it doesn't exist
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

-- 4. Create voices table if it doesn't exist
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

-- 5. Create simple API key storage table
CREATE TABLE IF NOT EXISTS public.provider_api_keys (
  provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Enable RLS on all tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_api_keys ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
DROP POLICY IF EXISTS "Admins manage providers" ON public.providers;
CREATE POLICY "Admins manage providers"
  ON public.providers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage models" ON public.models;
CREATE POLICY "Admins manage models"
  ON public.models
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage voices" ON public.voices;
CREATE POLICY "Admins manage voices"
  ON public.voices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage provider API keys" ON public.provider_api_keys;
CREATE POLICY "Admins manage provider API keys"
  ON public.provider_api_keys
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Create RPC functions
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

-- 9. Grant permissions
REVOKE ALL ON FUNCTION public.store_provider_api_key(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_provider_api_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO service_role;

-- 10. Grant table permissions
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.models TO authenticated;
GRANT ALL ON public.voices TO authenticated;
GRANT ALL ON public.provider_api_keys TO authenticated;

SELECT 'Migration conflicts fixed successfully' as status;
