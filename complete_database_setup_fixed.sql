-- Complete Database Setup for NewWomen Application (FIXED VERSION)
-- This script applies all necessary migrations for the full application
-- Fixed to handle potential column conflicts

-- ============================================
-- COMMUNITY CHAT AND ANNOUNCEMENTS SYSTEM
-- ============================================

-- Create community_chat_rooms table
CREATE TABLE IF NOT EXISTS public.community_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL DEFAULT 'general' CHECK (room_type IN ('general', 'support', 'announcements', 'challenges', 'assessments', 'quizzes')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_chat_messages table
CREATE TABLE IF NOT EXISTS public.community_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.community_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'announcement', 'challenge', 'assessment', 'quiz')),
  metadata JSONB,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_announcements table
CREATE TABLE IF NOT EXISTS public.community_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL CHECK (announcement_type IN ('general', 'challenge', 'assessment', 'quiz', 'maintenance', 'feature')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'discovery', 'growth', 'transformation', 'premium')),
  is_active BOOLEAN DEFAULT true,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_announcement_reads table
CREATE TABLE IF NOT EXISTS public.community_announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.community_announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Create community_challenge_announcements table
CREATE TABLE IF NOT EXISTS public.community_challenge_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special')),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  reward_crystals INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_assessment_announcements table
CREATE TABLE IF NOT EXISTS public.community_assessment_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  special_instructions TEXT,
  reward_crystals INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_quiz_announcements table
CREATE TABLE IF NOT EXISTS public.community_quiz_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB,
  correct_answers JSONB,
  reward_crystals INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- AI ASSESSMENT SYSTEM TABLES (FIXED)
-- ============================================

-- Drop and recreate ai_assessment_configs table to fix column issues
DROP TABLE IF EXISTS public.ai_assessment_configs CASCADE;

-- Create ai_assessment_configs table with correct structure
CREATE TABLE public.ai_assessment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  system_prompt TEXT,
  user_prompt_template TEXT,
  evaluation_criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assessments_enhanced table
CREATE TABLE IF NOT EXISTS public.assessments_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty_level TEXT DEFAULT 'medium',
  time_limit_minutes INTEGER,
  questions JSONB NOT NULL,
  ai_config_id UUID REFERENCES public.ai_assessment_configs(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assessment_attempts table
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments_enhanced(id),
  user_id UUID REFERENCES auth.users(id),
  answers JSONB NOT NULL,
  ai_analysis TEXT,
  ai_score DECIMAL(5,2),
  ai_feedback JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_processing_queue table
CREATE TABLE IF NOT EXISTS public.ai_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.assessment_attempts(id),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  request_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assessment_categories table
CREATE TABLE IF NOT EXISTS public.assessment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_assessment_progress table
CREATE TABLE IF NOT EXISTS public.user_assessment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assessment_id UUID REFERENCES public.assessments_enhanced(id),
  total_attempts INTEGER DEFAULT 0,
  best_score DECIMAL(5,2),
  last_attempt_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, assessment_id)
);

-- Create ai_rate_limits table
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ai_provider TEXT NOT NULL,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ai_provider, window_start)
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.community_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_challenge_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_assessment_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_quiz_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assessment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Community Chat Rooms Policies
DROP POLICY IF EXISTS "Authenticated users can view active chat rooms" ON public.community_chat_rooms;
CREATE POLICY "Authenticated users can view active chat rooms"
  ON public.community_chat_rooms
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage chat rooms" ON public.community_chat_rooms;
CREATE POLICY "Admins can manage chat rooms"
  ON public.community_chat_rooms
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- Community Chat Messages Policies
DROP POLICY IF EXISTS "Authenticated users can view messages in active rooms" ON public.community_chat_messages;
CREATE POLICY "Authenticated users can view messages in active rooms"
  ON public.community_chat_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.community_chat_messages;
CREATE POLICY "Authenticated users can send messages"
  ON public.community_chat_messages
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Community Announcements Policies
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.community_announcements;
CREATE POLICY "Authenticated users can view active announcements"
  ON public.community_announcements
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.community_announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.community_announcements
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- Community Announcement Reads Policies
DROP POLICY IF EXISTS "Users can manage their own read status" ON public.community_announcement_reads;
CREATE POLICY "Users can manage their own read status"
  ON public.community_announcement_reads
  FOR ALL
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- AI Assessment Configs Policies
DROP POLICY IF EXISTS "Admins can manage AI configs" ON public.ai_assessment_configs;
CREATE POLICY "Admins can manage AI configs"
  ON public.ai_assessment_configs
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

DROP POLICY IF EXISTS "Authenticated users can view active AI configs" ON public.ai_assessment_configs;
CREATE POLICY "Authenticated users can view active AI configs"
  ON public.ai_assessment_configs
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Assessments Enhanced Policies
DROP POLICY IF EXISTS "Authenticated users can view active assessments" ON public.assessments_enhanced;
CREATE POLICY "Authenticated users can view active assessments"
  ON public.assessments_enhanced
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage assessments" ON public.assessments_enhanced;
CREATE POLICY "Admins can manage assessments"
  ON public.assessments_enhanced
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- Assessment Attempts Policies
DROP POLICY IF EXISTS "Users can manage their own attempts" ON public.assessment_attempts;
CREATE POLICY "Users can manage their own attempts"
  ON public.assessment_attempts
  FOR ALL
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- AI Processing Queue Policies
DROP POLICY IF EXISTS "Admins can manage processing queue" ON public.ai_processing_queue;
CREATE POLICY "Admins can manage processing queue"
  ON public.ai_processing_queue
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- AI Usage Logs Policies
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.ai_usage_logs;
CREATE POLICY "Users can view their own usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Assessment Categories Policies
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.assessment_categories;
CREATE POLICY "Authenticated users can view categories"
  ON public.assessment_categories
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- User Assessment Progress Policies
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_assessment_progress;
CREATE POLICY "Users can manage their own progress"
  ON public.user_assessment_progress
  FOR ALL
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- AI Rate Limits Policies
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.ai_rate_limits;
CREATE POLICY "Users can manage their own rate limits"
  ON public.ai_rate_limits
  FOR ALL
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_community_chat_rooms_type ON public.community_chat_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_community_chat_rooms_active ON public.community_chat_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_room_id ON public.community_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_user_id ON public.community_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_created_at ON public.community_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_community_announcements_active ON public.community_announcements(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_community_announcements_type ON public.community_announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_community_announcements_priority ON public.community_announcements(priority);
CREATE INDEX IF NOT EXISTS idx_community_announcement_reads_announcement_id ON public.community_announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_community_announcement_reads_user_id ON public.community_announcement_reads(user_id);

-- AI Assessment indexes
CREATE INDEX IF NOT EXISTS idx_ai_assessment_configs_active ON public.ai_assessment_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_assessments_enhanced_active ON public.assessments_enhanced(is_active);
CREATE INDEX IF NOT EXISTS idx_assessments_enhanced_category ON public.assessments_enhanced(category);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON public.assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_queue_status ON public.ai_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_assessment_progress_user_id ON public.user_assessment_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessment_progress_assessment_id ON public.user_assessment_progress(assessment_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_community_chat_rooms_updated_at ON public.community_chat_rooms;
CREATE TRIGGER update_community_chat_rooms_updated_at
    BEFORE UPDATE ON public.community_chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_announcements_updated_at ON public.community_announcements;
CREATE TRIGGER update_community_announcements_updated_at
    BEFORE UPDATE ON public.community_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_challenge_announcements_updated_at ON public.community_challenge_announcements;
CREATE TRIGGER update_community_challenge_announcements_updated_at
    BEFORE UPDATE ON public.community_challenge_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_assessment_announcements_updated_at ON public.community_assessment_announcements;
CREATE TRIGGER update_community_assessment_announcements_updated_at
    BEFORE UPDATE ON public.community_assessment_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_quiz_announcements_updated_at ON public.community_quiz_announcements;
CREATE TRIGGER update_community_quiz_announcements_updated_at
    BEFORE UPDATE ON public.community_quiz_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_assessment_configs_updated_at ON public.ai_assessment_configs;
CREATE TRIGGER update_ai_assessment_configs_updated_at
    BEFORE UPDATE ON public.ai_assessment_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessments_enhanced_updated_at ON public.assessments_enhanced;
CREATE TRIGGER update_assessments_enhanced_updated_at
    BEFORE UPDATE ON public.assessments_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_assessment_progress_updated_at ON public.user_assessment_progress;
CREATE TRIGGER update_user_assessment_progress_updated_at
    BEFORE UPDATE ON public.user_assessment_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default chat rooms
INSERT INTO public.community_chat_rooms (name, description, room_type, created_by) VALUES
('General Discussion', 'Open discussion about personal growth and wellness', 'general', NULL),
('Support Circle', 'Get support and share experiences with the community', 'support', NULL),
('Announcements', 'Official announcements and updates from NewWomen', 'announcements', NULL),
('Challenge Check-ins', 'Share progress and celebrate wins in challenges', 'challenges', NULL),
('Assessment Results', 'Share and discuss assessment results and insights', 'assessments', NULL),
('Quiz Corner', 'Test your knowledge with community quizzes', 'quizzes', NULL)
ON CONFLICT DO NOTHING;

-- Insert default assessment categories
INSERT INTO public.assessment_categories (name, description, color, icon) VALUES
('Personality', 'Personality assessments and tests', '#8B5CF6', 'user'),
('Wellness', 'Mental health and wellness assessments', '#10B981', 'heart'),
('Career', 'Career and professional development', '#F59E0B', 'briefcase'),
('Relationships', 'Relationship and communication assessments', '#EF4444', 'users'),
('Learning', 'Learning style and cognitive assessments', '#3B82F6', 'book-open')
ON CONFLICT (name) DO NOTHING;

-- Insert sample AI assessment config
INSERT INTO public.ai_assessment_configs (name, description, ai_provider, ai_model, temperature, max_tokens, system_prompt, user_prompt_template) VALUES
('Default Assessment Analyzer', 'Default AI configuration for assessment analysis', 'openai', 'gpt-4', 0.7, 1000, 
'You are an expert psychologist and assessment analyst. Analyze the user''s responses and provide detailed, personalized feedback.',
'Please analyze the following assessment responses and provide detailed feedback: {responses}');

-- Insert sample announcement
INSERT INTO public.community_announcements (title, content, announcement_type, priority, target_audience, created_by) VALUES
('Welcome to NewWomen Community!', 'Welcome to our amazing community of women supporting each other on their personal growth journey. We''re excited to have you here!', 'general', 'normal', 'all', NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all tables exist
SELECT 'Tables created successfully' as status, count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'community_chat_rooms', 'community_chat_messages', 'community_announcements', 
  'community_announcement_reads', 'ai_assessment_configs', 'assessments_enhanced',
  'assessment_attempts', 'ai_processing_queue', 'ai_usage_logs', 
  'assessment_categories', 'user_assessment_progress', 'ai_rate_limits'
);

-- Verify RLS is enabled
SELECT 'RLS enabled' as status, count(*) as rls_enabled_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN (
  'community_chat_rooms', 'community_chat_messages', 'community_announcements', 
  'community_announcement_reads', 'ai_assessment_configs', 'assessments_enhanced',
  'assessment_attempts', 'ai_processing_queue', 'ai_usage_logs', 
  'assessment_categories', 'user_assessment_progress', 'ai_rate_limits'
)
AND c.relrowsecurity = true;

-- Verify ai_assessment_configs table structure
SELECT 'AI Assessment Configs table structure' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_assessment_configs' 
AND table_schema = 'public'
ORDER BY ordinal_position;
