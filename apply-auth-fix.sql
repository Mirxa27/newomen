-- =====================================================
-- AUTHENTICATION FIX - Apply this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop all existing conflicting triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_creation();

-- Step 2: Drop all conflicting policies on user_profiles
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow individual insert" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow self profile creation" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow profile select" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow own profile update" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Step 3: Ensure role column exists
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

-- Step 4: Create the definitive trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile with default role, ignore conflicts
    INSERT INTO public.user_profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'MODERATOR')
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create clean, simple RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation via trigger" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 7: Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Test the trigger function (optional)
-- You can run this to test: SELECT public.handle_new_user();

-- =====================================================
-- VERIFICATION QUERIES (run these to verify setup)
-- =====================================================

-- Check if trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if policies exist:
-- SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';

-- Check user_profiles table structure:
-- SELECT column_name, data_type, column_default FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' ORDER BY ordinal_position;

-- =====================================================
-- COMPLETED! The authentication should now work.
-- =====================================================
