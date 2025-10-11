# Fix "Failed to load profile data" Error

## Problem
The user profile creation trigger is using `id` instead of `user_id`, causing a mismatch between the database trigger and the frontend query.

## Solution
Apply the SQL fix in the Supabase Dashboard SQL Editor.

---

## Steps to Fix

### 1. Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Copy and Run This SQL

```sql
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
```

### 3. Run the Query
- Click the **Run** button (or press Cmd/Ctrl + Enter)
- You should see: "Success. No rows returned"

### 4. Verify the Fix
Try signing up again on your app. The profile should now be created correctly.

---

## What This Fixes

### Before (Broken)
- Trigger inserted: `INSERT INTO user_profiles (id, email, ...) VALUES (NEW.id, ...)`
- Frontend queried: `SELECT * FROM user_profiles WHERE user_id = ?`
- **Result**: No match found → "Failed to load profile data"

### After (Fixed)
- Trigger inserts: `INSERT INTO user_profiles (user_id, email, ...) VALUES (NEW.id, ...)`
- Frontend queries: `SELECT * FROM user_profiles WHERE user_id = ?`
- **Result**: Profile found ✅

---

## Alternative: Fix Existing Users

If you have users who already signed up and have broken profiles, run this to fix them:

```sql
-- Update existing profiles to set user_id correctly
UPDATE public.user_profiles
SET user_id = id
WHERE user_id IS NULL;
```

---

## Verification

After applying the fix, test:
1. Sign up with a new email
2. Check that no "Failed to load profile data" error appears
3. Verify profile is created in Database > user_profiles table

---

## Need Help?

If the error persists after applying this fix:
1. Check browser console for detailed error messages
2. Verify RLS policies in Database > user_profiles > Policies
3. Ensure the trigger exists in Database > Functions > handle_new_user
