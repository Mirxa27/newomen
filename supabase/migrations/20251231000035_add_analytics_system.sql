-- Phase 9: Advanced Analytics & Tracking System

-- 1. User Activity Tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100), -- 'login', 'feature_use', 'content_viewed', 'action_completed'
  feature_name VARCHAR(255),
  feature_category VARCHAR(100), -- 'meditation', 'podcast', 'community', 'shopping'
  duration_seconds INT,
  is_completed BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Engagement Metrics
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_active_streak INT DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  weekly_sessions INT DEFAULT 0,
  monthly_sessions INT DEFAULT 0,
  average_session_duration_minutes DECIMAL(10, 2),
  content_consumed_count INT DEFAULT 0,
  features_used JSONB,
  engagement_score DECIMAL(5, 2) DEFAULT 0,
  churn_risk_score DECIMAL(5, 2) DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Feature Analytics
CREATE TABLE IF NOT EXISTS feature_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name VARCHAR(255),
  feature_category VARCHAR(100),
  total_users_used INT DEFAULT 0,
  unique_daily_users INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  average_session_duration_minutes DECIMAL(10, 2),
  conversion_rate DECIMAL(5, 2),
  completion_rate DECIMAL(5, 2),
  satisfaction_rating DECIMAL(3, 2),
  recorded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Funnel Analytics (for subscription conversions)
CREATE TABLE IF NOT EXISTS funnel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name VARCHAR(255),
  step_number INT,
  step_name VARCHAR(255),
  users_reached INT DEFAULT 0,
  users_completed INT DEFAULT 0,
  conversion_rate DECIMAL(5, 2),
  dropout_rate DECIMAL(5, 2),
  average_time_spent_seconds INT,
  recorded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cohort Analysis
CREATE TABLE IF NOT EXISTS cohort_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_name VARCHAR(255),
  cohort_start_date DATE,
  cohort_period VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  cohort_size INT,
  total_retention_rate DECIMAL(5, 2),
  day_0_users INT,
  day_7_users INT,
  day_30_users INT,
  day_90_users INT,
  ltv NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Revenue Analytics
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE,
  total_revenue NUMERIC(12, 2),
  subscription_revenue NUMERIC(12, 2),
  refund_amount NUMERIC(12, 2),
  transaction_count INT,
  average_transaction_value NUMERIC(10, 2),
  new_subscribers INT,
  churned_subscribers INT,
  mrr NUMERIC(12, 2), -- Monthly Recurring Revenue
  arr NUMERIC(12, 2), -- Annual Recurring Revenue
  ltv NUMERIC(10, 2), -- Lifetime Value
  cac NUMERIC(10, 2), -- Customer Acquisition Cost
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Churn Analysis
CREATE TABLE IF NOT EXISTS churn_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan VARCHAR(100),
  churn_reason VARCHAR(255),
  churn_category VARCHAR(100), -- 'inactive', 'financial', 'competitive', 'other'
  last_active_date DATE,
  churned_date DATE,
  mrr_lost NUMERIC(10, 2),
  days_as_customer INT,
  predicted_score DECIMAL(5, 2),
  was_predicted BOOLEAN DEFAULT FALSE,
  recovery_attempted BOOLEAN DEFAULT FALSE,
  recovered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Retention Rates
CREATE TABLE IF NOT EXISTS retention_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE,
  end_date DATE,
  subscription_plan VARCHAR(100),
  day_1_retention DECIMAL(5, 2),
  day_7_retention DECIMAL(5, 2),
  day_30_retention DECIMAL(5, 2),
  day_90_retention DECIMAL(5, 2),
  day_365_retention DECIMAL(5, 2),
  cohort_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. A/B Test Results
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(255),
  control_group_id UUID,
  variant_group_id UUID,
  feature_tested VARCHAR(255),
  metric_measured VARCHAR(255),
  control_value DECIMAL(10, 4),
  variant_value DECIMAL(10, 4),
  lift_percentage DECIMAL(10, 2),
  confidence_level DECIMAL(5, 2),
  significance_level DECIMAL(5, 2),
  is_significant BOOLEAN DEFAULT FALSE,
  test_status VARCHAR(50), -- 'running', 'completed', 'inconclusive'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  sample_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Custom Events
CREATE TABLE IF NOT EXISTS custom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name VARCHAR(255),
  event_category VARCHAR(100),
  event_value NUMERIC,
  event_label VARCHAR(255),
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Heatmap Data
CREATE TABLE IF NOT EXISTS heatmap_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT,
  element_selector VARCHAR(255),
  click_count INT DEFAULT 0,
  hover_count INT DEFAULT 0,
  scroll_depth DECIMAL(5, 2),
  metadata JSONB,
  recorded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Performance Metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT,
  metric_name VARCHAR(100), -- 'page_load_time', 'fcp', 'lcp', 'cls'
  metric_value NUMERIC,
  unit VARCHAR(50),
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  browser_name VARCHAR(100),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON user_engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_analytics_date ON feature_analytics(recorded_date);
CREATE INDEX IF NOT EXISTS idx_feature_analytics_name ON feature_analytics(feature_name);
CREATE INDEX IF NOT EXISTS idx_funnel_name ON funnel_analytics(funnel_name);
CREATE INDEX IF NOT EXISTS idx_funnel_date ON funnel_analytics(recorded_date);
CREATE INDEX IF NOT EXISTS idx_cohort_analysis_date ON cohort_analysis(cohort_start_date);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_analytics(date);
CREATE INDEX IF NOT EXISTS idx_churn_user ON churn_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_date ON churn_analysis(churned_date);
CREATE INDEX IF NOT EXISTS idx_retention_date ON retention_rates(start_date);
CREATE INDEX IF NOT EXISTS idx_ab_test_status ON ab_test_results(test_status);
CREATE INDEX IF NOT EXISTS idx_custom_events_user ON custom_events(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_events_name ON custom_events(event_name);
CREATE INDEX IF NOT EXISTS idx_heatmap_page ON heatmap_data(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_page ON performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_date ON performance_metrics(recorded_at);

-- Enable RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Activity - Users see their own, admin/analyst see all
CREATE POLICY "activity_user_read" ON user_activity_log
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid() AND role_id IN (
      SELECT id FROM admin_roles WHERE role_name IN ('admin', 'analyst')
    ))
  );

-- Engagement Metrics - Users see their own, admin/analyst see all
CREATE POLICY "engagement_user_read" ON user_engagement_metrics
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid() AND role_id IN (
      SELECT id FROM admin_roles WHERE role_name IN ('admin', 'analyst')
    ))
  );

-- Feature Analytics - Admin/analyst only
CREATE POLICY "feature_analytics_read" ON feature_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid() AND role_id IN (
      SELECT id FROM admin_roles WHERE role_name IN ('admin', 'analyst')
    ))
  );

-- Revenue Analytics - Admin only
CREATE POLICY "revenue_analytics_read" ON revenue_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid() AND role_id IN (
      SELECT id FROM admin_roles WHERE role_name = 'admin'
    ))
  );

-- Custom Events - Users write their own
CREATE POLICY "custom_events_write" ON custom_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
