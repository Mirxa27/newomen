-- Make admin user a premium member
UPDATE user_profiles
SET subscription_tier = 'transformation', remaining_minutes = 999999
WHERE role = 'admin';
