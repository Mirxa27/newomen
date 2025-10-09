-- Add frontend_name field to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'frontend_name'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN frontend_name TEXT;
  END IF;
END $$;

-- Add index for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_user_profiles_frontend_name'
  ) THEN
    CREATE INDEX idx_user_profiles_frontend_name ON user_profiles(frontend_name);
  END IF;
END $$;

-- Update RLS policies to include frontend_name in admin updates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname = 'Admins can update user profiles'
  ) THEN
    DROP POLICY "Admins can update user profiles" ON user_profiles;
  END IF;
END $$;

CREATE POLICY "Admins can update user profiles" ON user_profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.frontend_name IS 'Display name shown to other users in the frontend';