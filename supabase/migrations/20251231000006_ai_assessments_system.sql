-- AI-Powered Assessments, Quizzes, and Challenges System

-- AI Configuration Settings
CREATE TABLE IF NOT EXISTS public.ai_assessment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
  use_case_id UUID REFERENCES public.ai_use_cases(id) ON DELETE CASCADE,
  behavior_id UUID REFERENCES public.ai_behaviors(id) ON DELETE CASCADE,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  system_prompt TEXT NOT NULL,
  evaluation_criteria JSONB, -- Scoring rubrics, difficulty levels, etc.
  fallback_message TEXT DEFAULT 'AI analysis is temporarily unavailable. Please try again later.',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('assessment', 'quiz', 'challenge')),
  category TEXT NOT NULL,
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  ai_config_id UUID REFERENCES public.ai_assessment_configs(id) ON DELETE SET NULL,
  questions JSONB NOT NULL, -- Array of question objects
  scoring_rubric JSONB, -- AI scoring criteria
  passing_score DECIMAL(5,2) DEFAULT 70.0,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Attempts
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments_enhanced(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timeout')),
  raw_responses JSONB NOT NULL, -- User's actual responses
  ai_analysis JSONB, -- AI-generated analysis
  ai_score DECIMAL(5,2),
  ai_feedback TEXT,
  ai_explanation TEXT,
  is_ai_processed BOOLEAN DEFAULT false,
  ai_processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Processing Queue
CREATE TABLE IF NOT EXISTS public.ai_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  processing_type TEXT NOT NULL CHECK (processing_type IN ('assessment', 'quiz', 'challenge')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
  priority INTEGER DEFAULT 1,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES public.assessments_enhanced(id) ON DELETE SET NULL,
  attempt_id UUID REFERENCES public.assessment_attempts(id) ON DELETE SET NULL,
  ai_config_id UUID REFERENCES public.ai_assessment_configs(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  processing_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Categories
CREATE TABLE IF NOT EXISTS public.assessment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Assessment Progress
CREATE TABLE IF NOT EXISTS public.user_assessment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments_enhanced(id) ON DELETE CASCADE,
  best_score DECIMAL(5,2),
  best_attempt_id UUID REFERENCES public.assessment_attempts(id) ON DELETE SET NULL,
  total_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, assessment_id)
);

-- Challenge Types (for couples challenges, etc.)
CREATE TABLE IF NOT EXISTS public.challenge_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  ai_config_id UUID REFERENCES public.ai_assessment_configs(id) ON DELETE SET NULL,
  template_data JSONB, -- Challenge template structure
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge Participants
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.assessments_enhanced(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'completed')),
  joined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Rate Limiting
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_duration_minutes INTEGER DEFAULT 60,
  max_requests INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider_name, window_start)
);

-- Insert default categories
INSERT INTO public.assessment_categories (name, description, icon, color) VALUES
('Personality', 'Personality assessments and tests', 'user', '#3B82F6'),
('Wellness', 'Mental health and wellness assessments', 'heart', '#10B981'),
('Relationships', 'Relationship and communication assessments', 'users', '#F59E0B'),
('Career', 'Career and professional development assessments', 'briefcase', '#8B5CF6'),
('Learning', 'Educational and skill-based assessments', 'book-open', '#06B6D4'),
('Challenges', 'Interactive challenges and games', 'trophy', '#EF4444');

-- Insert default challenge types
INSERT INTO public.challenge_types (name, description, category, template_data) VALUES
('Couples Communication', 'Improve communication between partners', 'relationships', '{"questions": [], "scoring": {}}'),
('Personal Growth', 'Individual development challenges', 'wellness', '{"questions": [], "scoring": {}}'),
('Team Building', 'Group collaboration challenges', 'relationships', '{"questions": [], "scoring": {}}');

-- Enable RLS on all tables
ALTER TABLE public.ai_assessment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Assessment Configs (admin only)
CREATE POLICY "Admins can manage AI assessment configs" ON public.ai_assessment_configs
  FOR ALL USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for Enhanced Assessments
CREATE POLICY "Users can view public assessments" ON public.assessments_enhanced
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Admins can manage all assessments" ON public.assessments_enhanced
  FOR ALL USING (auth.email() = 'admin@newomen.me');

CREATE POLICY "Users can manage their own assessments" ON public.assessments_enhanced
  FOR ALL USING (created_by = auth.uid());

-- RLS Policies for Assessment Attempts
CREATE POLICY "Users can view their own attempts" ON public.assessment_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own attempts" ON public.assessment_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attempts" ON public.assessment_attempts
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for AI Processing Queue (admin only)
CREATE POLICY "Admins can manage AI processing queue" ON public.ai_processing_queue
  FOR ALL USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for AI Usage Logs (admin only)
CREATE POLICY "Admins can view AI usage logs" ON public.ai_usage_logs
  FOR SELECT USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for Assessment Categories
CREATE POLICY "Everyone can view active categories" ON public.assessment_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.assessment_categories
  FOR ALL USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for User Assessment Progress
CREATE POLICY "Users can view their own progress" ON public.user_assessment_progress
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for Challenge Types (admin only)
CREATE POLICY "Admins can manage challenge types" ON public.challenge_types
  FOR ALL USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for Challenge Participants
CREATE POLICY "Users can view their own challenges" ON public.challenge_participants
  FOR SELECT USING (user_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "Users can join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for AI Rate Limits
CREATE POLICY "Users can view their own rate limits" ON public.ai_rate_limits
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON public.assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_queue_status ON public.ai_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_queue_priority ON public.ai_processing_queue(priority);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_assessment_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_assessment ON public.user_assessment_progress(assessment_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_assessment_configs_updated_at BEFORE UPDATE ON public.ai_assessment_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_enhanced_updated_at BEFORE UPDATE ON public.assessments_enhanced FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_assessment_progress_updated_at BEFORE UPDATE ON public.user_assessment_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_rate_limits_updated_at BEFORE UPDATE ON public.ai_rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check AI rate limits
CREATE OR REPLACE FUNCTION check_ai_rate_limit(
  p_user_id UUID,
  p_provider_name TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := NOW() - INTERVAL '1 minute' * p_window_minutes;

  SELECT COALESCE(SUM(requests_count), 0) INTO current_count
  FROM public.ai_rate_limits
  WHERE user_id = p_user_id
    AND provider_name = p_provider_name
    AND window_start >= window_start;

  RETURN current_count < p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment AI rate limit
CREATE OR REPLACE FUNCTION increment_ai_rate_limit(
  p_user_id UUID,
  p_provider_name TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.ai_rate_limits (user_id, provider_name, requests_count, window_start, max_requests, window_duration_minutes)
  VALUES (p_user_id, p_provider_name, 1, NOW(), p_max_requests, p_window_minutes)
  ON CONFLICT (user_id, provider_name, window_start)
  DO UPDATE SET requests_count = ai_rate_limits.requests_count + 1;
END;
$$ LANGUAGE plpgsql;
