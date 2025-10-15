-- =====================================================
-- COMPREHENSIVE CRITICAL FIXES
-- Apply this in Supabase SQL Editor immediately
-- =====================================================

-- STEP 1: Fix Authentication Trigger (MOST URGENT)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_creation();

DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow individual insert" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow self profile creation" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow profile select" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow own profile update" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Ensure role column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN role text DEFAULT 'MODERATOR';
    END IF;
END $$;

-- Create the definitive trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'MODERATOR')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create clean RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation via trigger" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 2: Fix get_newme_user_context function
CREATE OR REPLACE FUNCTION get_newme_user_context()
RETURNS TABLE (
    user_id UUID,
    total_memories INTEGER,
    recent_memories INTEGER,
    average_importance DECIMAL,
    last_memory_date TIMESTAMPTZ,
    conversation_count INTEGER,
    last_conversation_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id as user_id,
        COALESCE(COUNT(DISTINCT nm.id), 0) as total_memories,
        COALESCE(COUNT(DISTINCT CASE WHEN nm.created_at > NOW() - INTERVAL '7 days' THEN nm.id END), 0) as recent_memories,
        COALESCE(AVG(nm.importance_score), 0) as average_importance,
        MAX(nm.created_at) as last_memory_date,
        COALESCE(COUNT(DISTINCT nc.id), 0) as conversation_count,
        MAX(nc.created_at) as last_conversation_date
    FROM user_profiles up
    LEFT JOIN newme_user_memories nm ON up.id = nm.user_id
    LEFT JOIN newme_conversations nc ON up.id = nc.user_id
    WHERE up.id = auth.uid()
    GROUP BY up.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Fix Chat RLS Policy
DROP POLICY IF EXISTS "NewMe conversations viewable by admins only" ON newme_conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON newme_conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON newme_conversations;

CREATE POLICY "Users can view own conversations" ON newme_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON newme_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON newme_conversations
    FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE newme_conversations ENABLE ROW LEVEL SECURITY;

-- STEP 4: Fix CORS for Edge Functions
-- Update gamification-engine function CORS
UPDATE supabase.functions.function_config
SET cors_config = '{
  "allowed_origins": ["*"],
  "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowed_headers": ["*"],
  "exposed_headers": [],
  "max_age": 3600,
  "credentials": true
}'::jsonb
WHERE name = 'gamification-engine';

-- Update realtime-token function CORS
UPDATE supabase.functions.function_config
SET cors_config = '{
  "allowed_origins": ["*"],
  "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowed_headers": ["*"],
  "exposed_headers": [],
  "max_age": 3600,
  "credentials": true
}'::jsonb
WHERE name = 'realtime-token';

-- STEP 5: Create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_newme_user_memories_user_id ON newme_user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_newme_conversations_user_id ON newme_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_newme_user_memories_created_at ON newme_user_memories(created_at);

-- STEP 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Test user context function:
-- SELECT * FROM get_newme_user_context();

-- Check policies:
-- SELECT policyname FROM pg_policies WHERE tablename IN ('user_profiles', 'newme_conversations');

-- =====================================================
-- COMPLETED! All critical issues should now be resolved.
-- =====================================================
