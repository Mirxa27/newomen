# Manual Supabase Setup Instructions

Since the CLI is encountering conflicts with existing data, here's how to manually apply the provider setup to your Supabase database:

## Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `fkikaozubngmzcrnhkqe`
3. Navigate to **SQL Editor**

## Step 2: Apply Provider Setup
Copy and paste the following SQL script into the SQL Editor and run it:

```sql
-- Provider Setup for Newomen
-- This script sets up AI provider management without conflicts

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

-- 4. Create simple API key storage table
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

-- 6. Create RLS policies
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

-- 7. Create RPC functions
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

-- 8. Grant permissions
REVOKE ALL ON FUNCTION public.store_provider_api_key(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_provider_api_key(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_provider_api_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key(uuid) TO service_role;

-- 9. Grant table permissions
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.models TO authenticated;
GRANT ALL ON public.voices TO authenticated;
GRANT ALL ON public.provider_api_keys TO authenticated;

-- 10. Verify setup
SELECT 'Provider setup completed successfully' as status;
```

## Step 3: Deploy Edge Functions
After the database setup is complete, deploy the Edge Functions:

1. Go to **Edge Functions** in your Supabase dashboard
2. Create a new function called `provider-discovery-simple`
3. Copy the contents from `supabase/functions/provider-discovery-simple/index.ts`
4. Deploy the function

## Step 4: Test the Setup
1. Go to your application at `newomen.me/admin`
2. Navigate to the "AI Providers" tab
3. Try adding a new provider (e.g., OpenAI)
4. The system should now work without the "Edge Function returned a non-2xx status code" error

## Alternative: Use Supabase CLI with Force
If you prefer to use the CLI, you can try:

```bash
# Force push all migrations
npx supabase db push --include-all --force

# Or reset the database (WARNING: This will delete all data)
npx supabase db reset --linked
```

## Verification
After applying the setup, you should see:
- ✅ `providers` table created
- ✅ `models` table created  
- ✅ `voices` table created
- ✅ `provider_api_keys` table created
- ✅ RLS policies applied
- ✅ RPC functions created
- ✅ Edge Function deployed

The AI provider discovery should now work correctly!
