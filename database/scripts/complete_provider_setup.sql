-- Complete Provider Discovery Setup
-- This script sets up all necessary components for AI provider management

-- 1. Set the provider encryption key
ALTER DATABASE postgres SET app.settings.provider_encryption_key = 'dev-encryption-key-2024-newomen-secure';

-- 2. Create providers table if it doesn't exist
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

-- 5. Create provider_credentials table for encrypted API key storage
CREATE TABLE IF NOT EXISTS public.provider_credentials (
  provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  encrypted_api_key BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Enable RLS on all tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for providers
DROP POLICY IF EXISTS "Admins manage providers" ON public.providers;
CREATE POLICY "Admins manage providers"
  ON public.providers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Create RLS policies for models
DROP POLICY IF EXISTS "Admins manage models" ON public.models;
CREATE POLICY "Admins manage models"
  ON public.models
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Create RLS policies for voices
DROP POLICY IF EXISTS "Admins manage voices" ON public.voices;
CREATE POLICY "Admins manage voices"
  ON public.voices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. Create RLS policies for provider_credentials
DROP POLICY IF EXISTS "Admins manage provider credentials" ON public.provider_credentials;
CREATE POLICY "Admins manage provider credentials"
  ON public.provider_credentials
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create update triggers
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

DROP TRIGGER IF EXISTS update_provider_credentials_updated_at ON public.provider_credentials;
CREATE TRIGGER update_provider_credentials_updated_at
  BEFORE UPDATE ON public.provider_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Create the store_provider_api_key function
CREATE OR REPLACE FUNCTION public.store_provider_api_key(p_provider_id uuid, p_api_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key text;
BEGIN
  v_encryption_key := current_setting('app.settings.provider_encryption_key', true);

  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    RAISE EXCEPTION 'provider_encryption_key_not_configured';
  END IF;

  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  INSERT INTO public.provider_credentials(provider_id, encrypted_api_key)
  VALUES (p_provider_id, pgp_sym_encrypt(p_api_key, v_encryption_key))
  ON CONFLICT (provider_id)
  DO UPDATE
  SET encrypted_api_key = EXCLUDED.encrypted_api_key,
      updated_at = now();
END;
$$;

-- 14. Create the get_provider_api_key function
CREATE OR REPLACE FUNCTION public.get_provider_api_key(p_provider_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key text;
  v_api_key text;
BEGIN
  v_encryption_key := current_setting('app.settings.provider_encryption_key', true);

  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    RAISE EXCEPTION 'provider_encryption_key_not_configured';
  END IF;

  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  SELECT pgp_sym_decrypt(encrypted_api_key, v_encryption_key)::text
    INTO v_api_key
    FROM public.provider_credentials
    WHERE provider_id = p_provider_id;

  RETURN v_api_key;
END;
$$;

-- 15. Grant permissions
REVOKE ALL ON FUNCTION public.store_provider_api_key(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_provider_api_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO service_role;

-- 16. Grant table permissions
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.models TO authenticated;
GRANT ALL ON public.voices TO authenticated;
GRANT ALL ON public.provider_credentials TO authenticated;

-- 17. Verify the setup
SELECT 'Provider setup completed successfully' as status;
