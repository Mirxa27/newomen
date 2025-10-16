-- Grant Admin and Moderation Access to Katrina@newomen.me
-- Run this in Supabase SQL Editor or via the CLI

-- Step 1: Check if user exists and get their details
SELECT id, email, role FROM public.user_profiles 
WHERE lower(email) = lower('Katrina@newomen.me');

-- Step 2: If user exists, update their role to 'admin' 
-- (admin includes moderation capabilities by default)
UPDATE public.user_profiles
SET role = 'admin'
WHERE lower(email) = lower('Katrina@newomen.me');

-- Step 3: Verify the update was successful
SELECT id, email, role FROM public.user_profiles 
WHERE lower(email) = lower('Katrina@newomen.me');

-- Alternative: If the user needs to be created first, they must sign up through the app
-- Once they sign up, run Step 2 above to promote them to admin

-- Note: The 'admin' role automatically grants:
-- - Full moderation capabilities
-- - Access to admin panel
-- - User management permissions
-- - Content management permissions
-- - All system administration features
