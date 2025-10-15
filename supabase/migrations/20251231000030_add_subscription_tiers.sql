-- Phase 2: Premium Tier System (Subscription Tiers, Access Control, Billing)

-- 1. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'lite', 'pro'
  display_name VARCHAR(100) NOT NULL,
  monthly_price DECIMAL(10,2),
  yearly_price DECIMAL(10,2),
  description TEXT,
  features TEXT[], -- array of feature identifiers
  max_meditations INT,
  max_affirmations INT,
  max_habits INT,
  has_podcasts BOOLEAN DEFAULT FALSE,
  has_buddy_system BOOLEAN DEFAULT FALSE,
  has_community_events BOOLEAN DEFAULT FALSE,
  has_ad_free BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update user_profiles with subscription tracking
ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_auto_renew BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMPTZ;

-- 3. Subscription History Tracking
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tier VARCHAR(50),
  to_tier VARCHAR(50),
  payment_method VARCHAR(50), -- 'stripe', 'paypal', 'manual'
  amount_paid DECIMAL(10,2),
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  status VARCHAR(50), -- 'active', 'cancelled', 'failed', 'refunded'
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Feature Access Control
CREATE TABLE IF NOT EXISTS feature_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL, -- 'podcasts', 'buddy_system', 'advanced_analytics', etc.
  access_level VARCHAR(50), -- 'free', 'lite', 'pro'
  has_access BOOLEAN DEFAULT FALSE,
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_name)
);

-- 5. Payment Methods (for storing multiple payment methods)
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id VARCHAR(255) NOT NULL, -- Stripe or PayPal ID
  payment_provider VARCHAR(50), -- 'stripe', 'paypal'
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Billing Invoices
CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscription_history(id),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- 'draft', 'sent', 'paid', 'failed', 'refunded'
  payment_method VARCHAR(50),
  billing_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Promo Codes / Discounts
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(50), -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INT,
  current_uses INT DEFAULT 0,
  applicable_tiers TEXT[], -- which tiers this applies to
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_admin UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. User Promo Code Usage
CREATE TABLE IF NOT EXISTS user_promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
  subscription_id UUID REFERENCES subscription_history(id),
  discount_applied DECIMAL(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Refund Requests
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES billing_invoices(id),
  reason TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50), -- 'pending', 'approved', 'rejected', 'processed'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by_admin UUID REFERENCES auth.users(id),
  notes TEXT
);

-- 10. Subscription Usage Analytics
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(50),
  meditations_completed INT DEFAULT 0,
  habits_created INT DEFAULT 0,
  community_posts INT DEFAULT 0,
  podcasts_played INT DEFAULT 0,
  diary_entries INT DEFAULT 0,
  card_readings INT DEFAULT 0,
  month TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON subscription_plans(tier_name);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON subscription_history(status);
CREATE INDEX IF NOT EXISTS idx_feature_access_user ON feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_feature ON feature_access(feature_name);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_user ON billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- Seed initial subscription plans
INSERT INTO subscription_plans (tier_name, display_name, monthly_price, yearly_price, description, features, max_meditations, max_affirmations, max_habits, has_ad_free, is_active)
VALUES 
  ('free', 'Free', 0.00, 0.00, 'Get started with basic wellness features', ARRAY['basic_meditations', 'daily_affirmations', 'habit_tracker'], 10, 5, 3, FALSE, TRUE),
  ('lite', 'Lite', 9.99, 99.90, 'Unlock premium meditation and wellness content', ARRAY['all_meditations', 'all_affirmations', 'unlimited_habits', 'audio_library', 'spiritual_tools', 'diary_features'], 115, 200, -1, FALSE, TRUE),
  ('pro', 'Pro', 19.99, 199.90, 'Complete wellness experience with everything', ARRAY['all_meditations', 'all_affirmations', 'unlimited_habits', 'audio_library', 'spiritual_tools', 'diary_features', 'podcasts', 'buddy_system', 'community_events', 'advanced_analytics'], 999, 999, -1, TRUE, TRUE)
ON CONFLICT (tier_name) DO NOTHING;

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_promo_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Public read access to subscription plans
CREATE POLICY "subscription_plans_public_read" ON subscription_plans
  FOR SELECT USING (TRUE);

-- User subscription policies
CREATE POLICY "subscription_history_user_read" ON subscription_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscription_history_user_write" ON subscription_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feature access policies
CREATE POLICY "feature_access_user_read" ON feature_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "feature_access_user_write" ON feature_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment methods - user can only see their own
CREATE POLICY "payment_methods_user_read" ON user_payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_methods_user_write" ON user_payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Invoices - user can only see their own
CREATE POLICY "invoices_user_read" ON billing_invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Refund requests - user can see their own
CREATE POLICY "refund_requests_user_read" ON refund_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "refund_requests_user_write" ON refund_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage analytics - user can see their own
CREATE POLICY "subscription_usage_user_read" ON subscription_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for promo codes
CREATE POLICY "promo_codes_admin_all" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND user_role = 'admin'
    )
  );

CREATE POLICY "promo_codes_public_read" ON promo_codes
  FOR SELECT USING (is_active = TRUE);
