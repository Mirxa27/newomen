BEGIN;

-- Enable RLS on user_profiles if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace the trigger function for handling new users
CREATE OR REPLACE FUNCTION handle_new_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'MODERATOR')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_creation();

-- Recreate policies with proper permissions
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;

-- Allow insert based on auth.uid matching
DROP POLICY IF EXISTS "Allow self profile creation" ON user_profiles;
CREATE POLICY "Allow self profile creation"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow select on own profile and public fields
DROP POLICY IF EXISTS "Allow profile select" ON user_profiles;
CREATE POLICY "Allow profile select"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- Allow update on own profile
DROP POLICY IF EXISTS "Allow own profile update" ON user_profiles;
CREATE POLICY "Allow own profile update"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'MODERATOR';
    END IF;
END $$;

COMMIT;
