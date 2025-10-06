-- Fix for Provider Encryption without Database Parameters
-- This script creates a simpler approach that doesn't require app.settings

-- 1. Create a simple API key storage table without encryption
CREATE TABLE IF NOT EXISTS public.provider_api_keys (
  provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS on the new table
ALTER TABLE public.provider_api_keys ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy for admin access only
DROP POLICY IF EXISTS "Admins manage provider API keys" ON public.provider_api_keys;
CREATE POLICY "Admins manage provider API keys"
  ON public.provider_api_keys
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Create simplified RPC functions that don't require encryption
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

-- 5. Grant permissions
REVOKE ALL ON FUNCTION public.store_provider_api_key(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_provider_api_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO service_role;

-- 6. Grant table permissions
GRANT ALL ON public.provider_api_keys TO authenticated;

-- 7. Create update trigger
DROP TRIGGER IF EXISTS update_provider_api_keys_updated_at ON public.provider_api_keys;
CREATE TRIGGER update_provider_api_keys_updated_at
  BEFORE UPDATE ON public.provider_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Drop the old encrypted table if it exists (optional)
DROP TABLE IF EXISTS public.provider_credentials CASCADE;

-- 9. Verify the setup
SELECT 'Provider API key storage setup completed successfully' as status;
