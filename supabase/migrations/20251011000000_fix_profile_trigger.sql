-- Fix user profile creation trigger to use user_id correctly
BEGIN;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create corrected trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile with user_id pointing to auth.users.id
    INSERT INTO public.user_profiles (user_id, email, role, nickname)
    VALUES (NEW.id, NEW.email, 'MODERATOR', COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)))
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to use user_id
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow profile creation via trigger" ON public.user_profiles;
CREATE POLICY "Allow profile creation via trigger" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

COMMIT;
