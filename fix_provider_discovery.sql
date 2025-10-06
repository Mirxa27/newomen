-- Fix for Provider Discovery Edge Function
-- This script addresses the missing provider_encryption_key configuration

-- 1. Set the provider encryption key (you should change this to a secure random string)
-- This is a temporary key for development - in production, use a secure random key
ALTER DATABASE postgres SET app.settings.provider_encryption_key = 'dev-encryption-key-2024-newomen-secure';

-- 2. Ensure the provider_credentials table exists with proper structure
CREATE TABLE IF NOT EXISTS public.provider_credentials (
  provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  encrypted_api_key BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable RLS on provider_credentials
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies and recreate them
DROP POLICY IF EXISTS "Admins manage provider credentials" ON public.provider_credentials;
CREATE POLICY "Admins manage provider credentials"
  ON public.provider_credentials
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Ensure the RPC functions exist and are properly configured
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

-- 6. Grant proper permissions
REVOKE ALL ON FUNCTION public.store_provider_api_key(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_provider_api_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO service_role;

-- 7. Create update trigger for provider_credentials
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_provider_credentials_updated_at ON public.provider_credentials;
CREATE TRIGGER update_provider_credentials_updated_at
  BEFORE UPDATE ON public.provider_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Ensure providers table has the required columns
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS api_base TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- 9. Ensure models table has the required columns
ALTER TABLE public.models 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS model_id TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS modality TEXT,
ADD COLUMN IF NOT EXISTS context_limit INTEGER,
ADD COLUMN IF NOT EXISTS latency_hint_ms INTEGER,
ADD COLUMN IF NOT EXISTS is_realtime BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- 10. Ensure voices table has the required columns
ALTER TABLE public.voices 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS voice_id TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS locale TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS latency_hint_ms INTEGER,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- 11. Add unique constraints
ALTER TABLE public.models 
ADD CONSTRAINT IF NOT EXISTS models_provider_model_unique UNIQUE(provider_id, model_id);

ALTER TABLE public.voices 
ADD CONSTRAINT IF NOT EXISTS voices_provider_voice_unique UNIQUE(provider_id, voice_id);

-- 12. Enable RLS on all tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies for providers
DROP POLICY IF EXISTS "Admins manage providers" ON public.providers;
CREATE POLICY "Admins manage providers"
  ON public.providers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 14. Create RLS policies for models
DROP POLICY IF EXISTS "Admins manage models" ON public.models;
CREATE POLICY "Admins manage models"
  ON public.models
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 15. Create RLS policies for voices
DROP POLICY IF EXISTS "Admins manage voices" ON public.voices;
CREATE POLICY "Admins manage voices"
  ON public.voices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 16. Grant necessary permissions
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.models TO authenticated;
GRANT ALL ON public.voices TO authenticated;
GRANT ALL ON public.provider_credentials TO authenticated;
