-- Fix Z.AI API Key Retrieval
-- Add overloaded function to get API key by provider type/name

CREATE OR REPLACE FUNCTION public.get_provider_api_key_by_type(p_provider_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key text;
  v_provider_id uuid;
BEGIN
  -- Service role or admin only
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  -- Find provider by type or name (case-insensitive)
  SELECT id INTO v_provider_id
  FROM public.providers
  WHERE LOWER(type) = LOWER(p_provider_type)
     OR LOWER(name) = LOWER(p_provider_type)
  LIMIT 1;

  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Provider not found: %', p_provider_type;
  END IF;

  -- Get API key from provider_api_keys table
  SELECT api_key INTO v_api_key
  FROM public.provider_api_keys
  WHERE provider_id = v_provider_id;

  IF v_api_key IS NULL THEN
    RAISE EXCEPTION 'API key not configured for provider: %', p_provider_type;
  END IF;

  RETURN v_api_key;
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.get_provider_api_key_by_type(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key_by_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key_by_type(text) TO service_role;

-- Insert Z.AI provider if it doesn't exist
DO $$
BEGIN
  -- Check if updated_at column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'providers' 
    AND column_name = 'updated_at'
  ) THEN
    -- Insert with updated_at
    INSERT INTO public.providers (id, name, type, api_base, status)
    VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Z.AI',
      'zai',
      'https://api.z.ai/api/coding/paas/v4',
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      api_base = EXCLUDED.api_base,
      status = EXCLUDED.status,
      updated_at = now();
  ELSE
    -- Insert without updated_at
    INSERT INTO public.providers (id, name, type, api_base, status)
    VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Z.AI',
      'zai',
      'https://api.z.ai/api/coding/paas/v4',
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      api_base = EXCLUDED.api_base,
      status = EXCLUDED.status;
  END IF;
END $$;

COMMENT ON FUNCTION public.get_provider_api_key_by_type(text) IS 'Retrieves API key for a provider by type or name (e.g., ''zai'', ''openai'')';

