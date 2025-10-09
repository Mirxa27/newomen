-- Add frontend_name field to user_profiles table
ALTER TABLE user_profiles ADD COLUMN frontend_name TEXT;

-- Add index for better query performance
CREATE INDEX idx_user_profiles_frontend_name ON user_profiles(frontend_name);