-- Comprehensive Subscription System
-- New users: 10 minutes free
-- $22 plan: 100 minutes
-- $222 plan: 1000 minutes

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  currency TEXT DEFAULT 'USD' NOT NULL,
  minutes_included INTEGER NOT NULL CHECK (minutes_included >= 0),
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, description, price, minutes_included, features, sort_order, is_active) VALUES
('Free Trial', 'Get started with 10 free minutes', 0.00, 10, 
  '["10 minutes of talk time", "Access to basic features", "Community access", "Basic assessments"]'::jsonb, 
  1, true),
  
('100 Minutes Pack', '100 minutes of talk time', 22.00, 100,
  '["100 minutes of talk time", "All premium features", "Advanced AI insights", "Priority support", "Couples challenges", "Wellness library"]'::jsonb,
  2, true),
  
('1000 Minutes Pack', '1000 minutes of talk time - Best Value!', 222.00, 1000,
  '["1000 minutes of talk time", "All premium features", "Advanced AI insights", "Priority support", "Couples challenges", "Wellness library", "Exclusive content", "Personal coaching sessions"]'::jsonb,
  3, true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  minutes_included = EXCLUDED.minutes_included,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Update subscriptions table to track minutes
DO $$ 
BEGIN
  -- Add plan_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN plan_id UUID REFERENCES public.subscription_plans(id);
  END IF;
END $$;

-- Function to purchase subscription and add minutes
CREATE OR REPLACE FUNCTION purchase_subscription(
  p_user_id UUID,
  p_plan_id UUID,
  p_payment_id TEXT,
  p_payment_method TEXT DEFAULT 'paypal'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan RECORD;
  v_user_profile_id UUID;
  v_subscription_id UUID;
  v_new_minutes INTEGER;
BEGIN
  -- Get plan details
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = p_plan_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription plan not found or inactive';
  END IF;
  
  -- Get user profile id
  SELECT id INTO v_user_profile_id
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Create subscription record
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    provider,
    provider_id,
    status,
    tier,
    minutes_included,
    minutes_used,
    price,
    currency,
    created_at
  ) VALUES (
    v_user_profile_id,
    p_plan_id,
    p_payment_method,
    p_payment_id,
    'active',
    CASE 
      WHEN v_plan.price = 0 THEN 'discovery'
      WHEN v_plan.price = 22 THEN 'growth'
      WHEN v_plan.price = 222 THEN 'transformation'
      ELSE 'growth'
    END,
    v_plan.minutes_included,
    0,
    v_plan.price,
    v_plan.currency,
    NOW()
  ) RETURNING id INTO v_subscription_id;
  
  -- Add minutes to user profile
  UPDATE user_profiles
  SET 
    remaining_minutes = remaining_minutes + v_plan.minutes_included,
    subscription_tier = CASE 
      WHEN v_plan.price = 0 THEN subscription_tier -- Keep current tier for free
      WHEN v_plan.price >= 222 THEN 'transformation'
      WHEN v_plan.price >= 22 THEN 'growth'
      ELSE subscription_tier
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING remaining_minutes INTO v_new_minutes;
  
  -- Log the purchase
  INSERT INTO subscription_transactions (
    subscription_id,
    amount,
    currency,
    status,
    provider_transaction_id,
    created_at
  ) VALUES (
    v_subscription_id,
    v_plan.price,
    v_plan.currency,
    'completed',
    p_payment_id,
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'minutes_added', v_plan.minutes_included,
    'total_minutes', v_new_minutes,
    'plan_name', v_plan.name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error purchasing subscription: %', SQLERRM;
END;
$$;

-- Function to consume minutes during talk time
CREATE OR REPLACE FUNCTION consume_talk_minutes(
  p_user_id UUID,
  p_minutes_used INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
  v_profile_id UUID;
BEGIN
  -- Get user profile id
  SELECT id INTO v_profile_id
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Check if user has enough minutes
  SELECT remaining_minutes INTO v_remaining
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  IF v_remaining < p_minutes_used THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient minutes',
      'remaining_minutes', v_remaining,
      'required_minutes', p_minutes_used
    );
  END IF;
  
  -- Deduct minutes from user profile
  UPDATE user_profiles
  SET 
    remaining_minutes = GREATEST(0, remaining_minutes - p_minutes_used),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING remaining_minutes INTO v_remaining;
  
  -- Update most recent active subscription
  UPDATE subscriptions
  SET 
    minutes_used = minutes_used + p_minutes_used,
    updated_at = NOW()
  WHERE user_id = v_profile_id 
    AND status = 'active'
    AND id = (
      SELECT id FROM subscriptions 
      WHERE user_id = v_profile_id AND status = 'active' 
      ORDER BY created_at DESC LIMIT 1
    );
  
  RETURN json_build_object(
    'success', true,
    'minutes_consumed', p_minutes_used,
    'remaining_minutes', v_remaining
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error consuming minutes: %', SQLERRM;
END;
$$;

-- Function to get user subscription info
CREATE OR REPLACE FUNCTION get_user_subscription_info(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'remaining_minutes', COALESCE(up.remaining_minutes, 0),
    'subscription_tier', COALESCE(up.subscription_tier, 'discovery'),
    'current_level', COALESCE(up.current_level, 1),
    'crystal_balance', COALESCE(up.crystal_balance, 0),
    'active_subscriptions', (
      SELECT json_agg(json_build_object(
        'id', s.id,
        'plan_name', sp.name,
        'minutes_included', s.minutes_included,
        'minutes_used', s.minutes_used,
        'price', s.price,
        'status', s.status,
        'created_at', s.created_at
      ))
      FROM subscriptions s
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = up.id AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 5
    )
  ) INTO v_result
  FROM user_profiles up
  WHERE up.user_id = p_user_id;
  
  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_remaining_minutes ON user_profiles(remaining_minutes);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION purchase_subscription(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_talk_minutes(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO authenticated;

-- Update trigger for subscription_plans
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at_trigger ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at_trigger
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Add helpful comment
COMMENT ON TABLE subscription_plans IS 'Subscription plans: Free (10 min), $22 (100 min), $222 (1000 min)';
COMMENT ON FUNCTION purchase_subscription IS 'Purchase a subscription plan and add minutes to user account';
COMMENT ON FUNCTION consume_talk_minutes IS 'Deduct minutes from user account during talk sessions';
COMMENT ON FUNCTION get_user_subscription_info IS 'Get comprehensive subscription information for a user';
