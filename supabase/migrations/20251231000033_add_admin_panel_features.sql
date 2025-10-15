-- Phase 6: Admin Panel & Content Management

-- 1. Admin Dashboard Metrics
CREATE TABLE IF NOT EXISTS admin_dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100), -- 'users', 'subscriptions', 'revenue', 'engagement'
  metric_value NUMERIC,
  previous_value NUMERIC,
  trend_percentage DECIMAL(10, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Content Moderation Queue
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(100), -- 'post', 'comment', 'event', 'podcast'
  content_id UUID,
  reported_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'flagged'
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 3. User Management & Admin Notes
CREATE TABLE IF NOT EXISTS admin_user_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_notes TEXT,
  warning_count INT DEFAULT 0,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  suspension_until TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Content Management
CREATE TABLE IF NOT EXISTS admin_content_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(100), -- 'meditation', 'affirmation', 'podcast', 'article'
  content_id UUID,
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived', 'featured'
  is_featured BOOLEAN DEFAULT FALSE,
  feature_position INT,
  view_count INT DEFAULT 0,
  rating DECIMAL(3, 2),
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  featured_until TIMESTAMPTZ
);

-- 5. Admin Audit Log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(255),
  target_type VARCHAR(100), -- 'user', 'content', 'subscription', 'report'
  target_id VARCHAR(255),
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. System Settings & Configuration
CREATE TABLE IF NOT EXISTS admin_system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE,
  setting_value JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Admin Roles & Permissions
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(100) UNIQUE,
  description TEXT,
  permissions JSONB, -- Array of permission strings
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Admin User Roles
CREATE TABLE IF NOT EXISTS admin_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- 9. Bulk Operations Log
CREATE TABLE IF NOT EXISTS admin_bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(100), -- 'content_publish', 'user_suspend', 'email_campaign'
  total_count INT,
  successful_count INT,
  failed_count INT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_log TEXT
);

-- 10. Admin Communications Log
CREATE TABLE IF NOT EXISTS admin_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_type VARCHAR(100), -- 'announcement', 'maintenance', 'alert'
  title VARCHAR(255),
  message TEXT,
  target_users VARCHAR(50), -- 'all', 'free', 'lite', 'pro', 'specific'
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_moderation_status ON content_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_created ON content_moderation_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_user_mgmt_suspended ON admin_user_management(is_suspended);
CREATE INDEX IF NOT EXISTS idx_content_mgmt_featured ON admin_content_management(is_featured);
CREATE INDEX IF NOT EXISTS idx_content_mgmt_status ON admin_content_management(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_bulk_ops_status ON admin_bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_communications_sent ON admin_communications(sent_at);

-- Enable RLS
ALTER TABLE admin_dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_content_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only)
CREATE POLICY "admin_dashboard_read" ON admin_dashboard_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM admin_roles WHERE role_name IN ('admin', 'moderator')
      ))
  );

CREATE POLICY "moderation_queue_read" ON content_moderation_queue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM admin_roles WHERE role_name IN ('admin', 'moderator')
      ))
  );

CREATE POLICY "moderation_queue_update" ON content_moderation_queue
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM admin_roles WHERE role_name IN ('admin', 'moderator')
      ))
  );

CREATE POLICY "user_mgmt_read" ON admin_user_management
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM admin_roles WHERE role_name IN ('admin')
      ))
  );

CREATE POLICY "content_mgmt_read" ON admin_content_management
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM admin_roles WHERE role_name IN ('admin', 'editor')
      ))
  );

CREATE POLICY "audit_log_read" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM admin_roles WHERE role_name IN ('admin')
      ))
  );

CREATE POLICY "audit_log_write" ON admin_audit_log
  FOR INSERT WITH CHECK (
    admin_user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM admin_roles WHERE role_name IN ('admin', 'moderator', 'editor')
      ))
  );

-- Seed initial admin roles
INSERT INTO admin_roles (role_name, description, permissions) VALUES
  ('admin', 'Full system access', '["manage_users", "manage_content", "manage_moderators", "view_analytics", "manage_settings"]'::jsonb),
  ('moderator', 'Content moderation', '["moderate_content", "view_reports", "manage_users"]'::jsonb),
  ('editor', 'Content management', '["manage_content", "publish_content"]'::jsonb),
  ('analyst', 'Analytics view only', '["view_analytics", "view_reports"]'::jsonb)
ON CONFLICT (role_name) DO NOTHING;
