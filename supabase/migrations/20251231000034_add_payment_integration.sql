-- Phase 7: Payment Integration (Stripe & PayPal)

-- 1. Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_payment_method_id VARCHAR(255),
  paypal_account_id VARCHAR(255),
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50),
  expiry_month INT,
  expiry_year INT,
  billing_address JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscription_history(id) ON DELETE SET NULL,
  payment_method VARCHAR(50), -- 'stripe', 'paypal', 'apple', 'google'
  provider_transaction_id VARCHAR(255),
  amount NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- 'pending', 'completed', 'failed', 'refunded', 'disputed'
  description TEXT,
  metadata JSONB,
  receipt_url TEXT,
  failed_reason TEXT,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Refund Tracking
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  refund_amount NUMERIC(10, 2),
  reason VARCHAR(100), -- 'user_request', 'failed_charge', 'duplicate', 'other'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'rejected'
  provider_refund_id VARCHAR(255),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Invoice Generation
CREATE TABLE IF NOT EXISTS payment_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) UNIQUE,
  invoice_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  total_amount NUMERIC(10, 2),
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  items JSONB, -- Array of line items
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- 5. Payment Disputes
CREATE TABLE IF NOT EXISTS payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dispute_id VARCHAR(255),
  provider VARCHAR(50), -- 'stripe', 'paypal'
  reason VARCHAR(100),
  amount NUMERIC(10, 2),
  status VARCHAR(50), -- 'opened', 'under_review', 'won', 'lost'
  evidence TEXT,
  resolution_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payment Plans (for subscription flexibility)
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name VARCHAR(100),
  description TEXT,
  price NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(50), -- 'monthly', 'quarterly', 'annual'
  trial_days INT DEFAULT 0,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  stripe_price_id VARCHAR(255),
  paypal_plan_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payment Webhooks Log
CREATE TABLE IF NOT EXISTS payment_webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50), -- 'stripe', 'paypal'
  event_type VARCHAR(100),
  event_id VARCHAR(255),
  payload JSONB,
  processed_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'received', -- 'received', 'processing', 'processed', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tax Configuration
CREATE TABLE IF NOT EXISTS tax_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(2),
  state_code VARCHAR(5),
  tax_rate DECIMAL(5, 2),
  tax_name VARCHAR(100),
  applies_to JSONB, -- subscription types it applies to
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe ON payment_methods(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_paypal ON payment_methods(paypal_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON payment_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON payment_refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON payment_refunds(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON payment_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON payment_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON payment_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_disputes_transaction ON payment_disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_provider ON payment_webhooks_log(provider);
CREATE INDEX IF NOT EXISTS idx_webhooks_event ON payment_webhooks_log(event_type);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Payment Methods - Users see their own
CREATE POLICY "payment_methods_read" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_methods_write" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_methods_update" ON payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

-- Payment Transactions - Users see their own
CREATE POLICY "transactions_read" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Payment Invoices - Users see their own
CREATE POLICY "invoices_read" ON payment_invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Payment Plans - Public read
CREATE POLICY "plans_public_read" ON payment_plans
  FOR SELECT USING (is_active = TRUE);

-- Tax Configuration - Public read
CREATE POLICY "tax_config_read" ON tax_configuration
  FOR SELECT USING (is_active = TRUE);

-- Seed payment plans
INSERT INTO payment_plans (plan_name, description, price, currency, billing_period, features) VALUES
  ('Free', 'Free tier with basic features', 0, 'USD', 'monthly', '["basic_meditation", "3_affirmations", "habit_tracking"]'::jsonb),
  ('Lite Monthly', 'Lite tier - Monthly', 4.99, 'USD', 'monthly', '["unlimited_meditation", "podcast_access", "buddy_system", "all_affirmations"]'::jsonb),
  ('Lite Annual', 'Lite tier - Annual', 49.99, 'USD', 'annual', '["unlimited_meditation", "podcast_access", "buddy_system", "all_affirmations"]'::jsonb),
  ('Pro Monthly', 'Pro tier - Monthly', 9.99, 'USD', 'monthly', '["unlimited_everything", "priority_podcasts", "event_creation", "analytics", "community_challenges"]'::jsonb),
  ('Pro Annual', 'Pro tier - Annual', 99.99, 'USD', 'annual', '["unlimited_everything", "priority_podcasts", "event_creation", "analytics", "community_challenges"]'::jsonb)
ON CONFLICT DO NOTHING;
