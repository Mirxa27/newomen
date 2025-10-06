-- Fix user signup trigger to correctly reference user_id and handle potential nulls
BEGIN;

-- Drop existing trigger and function to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_creation();

-- Create the trigger function
CREATE OR REPLACE FUNCTION handle_new_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role, nickname)
  VALUES (NEW.id, NEW.email, 'user', 'New User')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_creation();

COMMIT;
