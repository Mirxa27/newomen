-- Fix authentication trigger and consolidate user_profiles setup
BEGIN;

-- Drop all existing policies and triggers to start fresh
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

-- Create the definitive trigger function for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile with default role
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

-- Create clean, simple RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow profile creation via trigger" ON public.user_profiles;
CREATE POLICY "Allow profile creation via trigger" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

COMMIT;
