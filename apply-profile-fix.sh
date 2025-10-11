#!/bin/bash

# Apply profile trigger fix via Supabase CLI
# This script executes the SQL fix to resolve "Failed to load profile data" error

echo "🔧 Applying profile trigger fix..."
echo ""

# Read the SQL file
SQL_CONTENT=$(cat supabase/migrations/20251011000000_fix_profile_trigger.sql)

# Create a temporary file without BEGIN/COMMIT for individual execution
cat > /tmp/fix_profile.sql << 'EOSQL'
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
EOSQL

echo "📝 SQL fix prepared. Now you need to apply it manually:"
echo ""
echo "Option 1: Via Supabase Dashboard (RECOMMENDED)"
echo "=============================================="
echo "1. Go to: https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/sql"
echo "2. Copy the contents of: supabase/migrations/20251011000000_fix_profile_trigger.sql"
echo "3. Paste into SQL Editor and click 'Run'"
echo ""
echo "Option 2: Via psql (if you have it installed)"
echo "=============================================="
echo "Run this command:"
echo "PGPASSWORD='Newomen@331144' psql -h db.fkikaozubngmzcrnhkqe.supabase.co -p 5432 -U postgres -d postgres -f /tmp/fix_profile.sql"
echo ""
echo "✅ After applying, test signup again - the error should be gone!"
