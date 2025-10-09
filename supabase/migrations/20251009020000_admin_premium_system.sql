-- Make all admin users premium with unlimited access
-- This migration addresses the original request to make admins premium members

-- Update existing admin users to have premium subscription
UPDATE user_profiles
SET
  subscription_tier = 'transformation',
  remaining_minutes = 999999,
  updated_at = now()
WHERE role IN ('admin', 'superadmin');

-- Create a function to automatically make new admin users premium
CREATE OR REPLACE FUNCTION make_admin_premium()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user role is being set to admin, give them premium access
  IF NEW.role IN ('admin', 'superadmin') AND (OLD.role IS NULL OR OLD.role NOT IN ('admin', 'superadmin')) THEN
    NEW.subscription_tier = 'transformation';
    NEW.remaining_minutes = 999999;
    NEW.updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically make admin users premium
DROP TRIGGER IF EXISTS make_admin_premium_trigger ON user_profiles;
CREATE TRIGGER make_admin_premium_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION make_admin_premium();

-- Add RLS policy to allow admins to manage all user profiles
CREATE POLICY "Admins can manage all user profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid()
      AND admin_profile.role IN ('admin', 'superadmin')
    )
  );

-- Create admin user management functions
CREATE OR REPLACE FUNCTION admin_update_user_profile(
  target_user_id uuid,
  new_role text DEFAULT NULL,
  new_subscription_tier text DEFAULT NULL,
  new_remaining_minutes integer DEFAULT NULL,
  new_nickname text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  admin_profile user_profiles%ROWTYPE;
  updated_profile user_profiles%ROWTYPE;
BEGIN
  -- Check if the calling user is an admin
  SELECT * INTO admin_profile
  FROM user_profiles
  WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Access denied: Only admins can update user profiles';
  END IF;

  -- Update the target user profile
  UPDATE user_profiles
  SET
    role = COALESCE(new_role, role),
    subscription_tier = COALESCE(new_subscription_tier, subscription_tier),
    remaining_minutes = COALESCE(new_remaining_minutes, remaining_minutes),
    nickname = COALESCE(new_nickname, nickname),
    updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', target_user_id;
  END IF;

  -- Return the updated profile as JSON
  RETURN row_to_json(updated_profile);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all user profiles for admin management
CREATE OR REPLACE FUNCTION admin_get_user_profiles(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  admin_profile user_profiles%ROWTYPE;
  result json;
BEGIN
  -- Check if the calling user is an admin
  SELECT * INTO admin_profile
  FROM user_profiles
  WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Access denied: Only admins can view all user profiles';
  END IF;

  -- Get user profiles with optional search
  SELECT json_agg(
    json_build_object(
      'id', id,
      'user_id', user_id,
      'email', email,
      'nickname', nickname,
      'role', role,
      'subscription_tier', subscription_tier,
      'remaining_minutes', remaining_minutes,
      'current_level', current_level,
      'crystal_balance', crystal_balance,
      'daily_streak', daily_streak,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO result
  FROM (
    SELECT * FROM user_profiles
    WHERE (search_term IS NULL OR
           email ILIKE '%' || search_term || '%' OR
           nickname ILIKE '%' || search_term || '%')
    ORDER BY created_at DESC
    LIMIT limit_count OFFSET offset_count
  ) profiles;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admin check is inside functions)
GRANT EXECUTE ON FUNCTION admin_update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_user_profiles TO authenticated;

-- Insert some sample admin data if no admin exists
DO $$
BEGIN
  -- Only insert if no admin exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE role IN ('admin', 'superadmin')) THEN
    -- This creates a placeholder admin profile that can be updated with real user data
    INSERT INTO user_profiles (
      id,
      user_id,
      email,
      nickname,
      role,
      subscription_tier,
      remaining_minutes,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000001',
      'admin@newomen.com',
      'System Admin',
      'admin',
      'transformation',
      999999,
      now(),
      now()
    );
  END IF;
END $$;
