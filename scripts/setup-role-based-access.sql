-- ================================================================
-- Role-Based Admin Access Setup Script
-- ================================================================
-- This script sets up the role hierarchy:
-- - superadmin: admin@newomen.me (ALL access)
-- - moderator: katrina@newomen.me (5 specific tabs only)
-- ================================================================

-- Step 1: Add superadmin role to constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'moderator', 'superadmin'));

-- Step 2: Update admin@newomen.me to superadmin (if exists)
UPDATE public.user_profiles 
SET role = 'superadmin' 
WHERE email = 'admin@newomen.me';

-- Step 3: Update Katrina@newomen.me to moderator (if exists)
UPDATE public.user_profiles 
SET role = 'moderator' 
WHERE email ILIKE 'Katrina@newomen.me';

-- Step 4: Verify roles
SELECT 
  id,
  email,
  role,
  created_at,
  CASE 
    WHEN role = 'superadmin' THEN '✓ Full admin access (all features)'
    WHEN role = 'moderator' THEN '✓ Limited access (5 tabs)'
    ELSE 'Standard user'
  END as access_level
FROM public.user_profiles 
WHERE email IN ('admin@newomen.me', 'Katrina@newomen.me')
ORDER BY role DESC;

-- Step 5: Show success message
DO $$
BEGIN
  RAISE NOTICE '✨ Role-based access control configured successfully!';
  RAISE NOTICE '   - admin@newomen.me → superadmin (all features)';
  RAISE NOTICE '   - Katrina@newomen.me → moderator (5 tabs)';
END $$;

