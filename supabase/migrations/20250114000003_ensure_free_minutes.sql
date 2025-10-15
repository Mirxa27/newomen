-- Ensure all new users receive 10 free minutes
-- Updates the user creation trigger to explicitly set initial minutes

-- Update the handle_new_user function to explicitly set 10 free minutes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_nickname TEXT;
  user_role TEXT;
BEGIN
  -- Determine nickname from metadata or email
  default_nickname := COALESCE(
    NEW.raw_user_meta_data->>'nickname',
    split_part(NEW.email, '@', 1),
    'Friend'
  );
  
  -- Determine role (admin for specific email, otherwise user)
  user_role := CASE 
    WHEN NEW.email = 'admin@newomen.me' THEN 'admin'
    ELSE 'user'
  END;
  
  -- Insert user profile with 10 free minutes
  INSERT INTO public.user_profiles (
    user_id, 
    nickname, 
    role,
    remaining_minutes,
    subscription_tier,
    current_level,
    crystal_balance,
    daily_streak
  )
  VALUES (
    NEW.id, 
    default_nickname, 
    user_role,
    10, -- 10 free minutes for all new users
    'discovery', -- Start with discovery tier
    1, -- Level 1
    0, -- No crystals yet
    0 -- No streak yet
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert user memory profile
  INSERT INTO public.user_memory_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure DEFAULT value is also set in table schema (in case trigger doesn't fire)
DO $$
BEGIN
  -- Update user_profiles table to ensure DEFAULT is 10 minutes
  ALTER TABLE public.user_profiles 
  ALTER COLUMN remaining_minutes SET DEFAULT 10;
  
  RAISE NOTICE 'Updated user_profiles.remaining_minutes DEFAULT to 10';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not update DEFAULT value: %', SQLERRM;
END $$;

-- Function to grant free trial minutes (can be called manually if needed)
CREATE OR REPLACE FUNCTION grant_free_trial_minutes(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_minutes INTEGER;
  v_new_minutes INTEGER;
BEGIN
  -- Get current minutes
  SELECT remaining_minutes INTO v_current_minutes
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Only grant if user has 0 minutes (hasn't received free trial yet)
  IF v_current_minutes = 0 THEN
    UPDATE user_profiles
    SET remaining_minutes = 10,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING remaining_minutes INTO v_new_minutes;
    
    -- Log the grant
    INSERT INTO subscription_transactions (
      subscription_id,
      amount,
      currency,
      status,
      provider_transaction_id,
      created_at
    )
    SELECT 
      s.id,
      0.00,
      'USD',
      'completed',
      'FREE_TRIAL_' || gen_random_uuid()::text,
      NOW()
    FROM subscriptions s
    JOIN user_profiles up ON s.user_id = up.id
    WHERE up.user_id = p_user_id
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    RETURN json_build_object(
      'success', true,
      'minutes_granted', 10,
      'total_minutes', v_new_minutes,
      'message', 'Free trial minutes granted'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'User already has minutes',
      'current_minutes', v_current_minutes
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error granting free trial minutes: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION grant_free_trial_minutes(UUID) TO authenticated;

-- Verify: Update any existing users with 0 minutes to have 10 minutes (one-time fix)
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.user_profiles
  SET remaining_minutes = 10,
      updated_at = NOW()
  WHERE remaining_minutes = 0
    AND subscription_tier = 'discovery'
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = user_profiles.id
      AND s.status = 'active'
      AND s.price > 0
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RAISE NOTICE 'Granted 10 free minutes to % existing users', updated_count;
  ELSE
    RAISE NOTICE 'No users needed free minutes update';
  END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION handle_new_user IS 'Automatically creates user profile with 10 free minutes when new auth user is created';
COMMENT ON FUNCTION grant_free_trial_minutes IS 'Manually grant 10 free trial minutes to a user (only if they have 0 minutes)';
COMMENT ON COLUMN user_profiles.remaining_minutes IS 'Talk time minutes remaining (new users start with 10 free minutes)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Free minutes system configured successfully!';
  RAISE NOTICE '   - New users will receive 10 free minutes automatically';
  RAISE NOTICE '   - Existing users with 0 minutes have been updated';
  RAISE NOTICE '   - Use grant_free_trial_minutes() function for manual grants';
END $$;
