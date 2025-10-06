-- AI-Powered Assessments, Quizzes, and Challenges Migration
-- Creates tables and functions for comprehensive AI-driven evaluation system

-- AI Configuration Table
CREATE TABLE ai_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'azure')),
    model_name TEXT NOT NULL,
    api_base_url TEXT,
    api_key_encrypted TEXT, -- Encrypted API keys
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0 AND max_tokens <= 4000),
    top_p DECIMAL(3,2) DEFAULT 1.0 CHECK (top_p > 0 AND top_p <= 1),
    frequency_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (frequency_penalty >= -2 AND frequency_penalty <= 2),
    presence_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (presence_penalty >= -2 AND presence_penalty <= 2),
    system_prompt TEXT,
    user_prompt_template TEXT,
    scoring_prompt_template TEXT,
    feedback_prompt_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Enhanced Assessments Table with AI Support
CREATE TABLE assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('personality', 'cognitive', 'emotional', 'career', 'relationship', 'wellness', 'custom')),
    category TEXT NOT NULL,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    estimated_duration_minutes INTEGER DEFAULT 15,
    max_attempts INTEGER DEFAULT 3,
    passing_score DECIMAL(5,2) DEFAULT 70.0,
    is_ai_powered BOOLEAN DEFAULT true,
    ai_configuration_id UUID REFERENCES ai_configurations(id),
    questions JSONB NOT NULL, -- Enhanced question structure with AI prompts
    scoring_rubric JSONB,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Quiz Table with AI Integration
CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    passing_score DECIMAL(5,2) DEFAULT 70.0,
    is_ai_powered BOOLEAN DEFAULT true,
    ai_configuration_id UUID REFERENCES ai_configurations(id),
    questions JSONB NOT NULL,
    ai_grading_prompt TEXT,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Challenge Table with AI Support
CREATE TABLE challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'skill_building', 'habit_formation', 'creative', 'social')),
    category TEXT NOT NULL,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    duration_days INTEGER DEFAULT 7,
    max_participants INTEGER,
    is_ai_powered BOOLEAN DEFAULT true,
    ai_configuration_id UUID REFERENCES ai_configurations(id),
    instructions TEXT NOT NULL,
    success_criteria JSONB,
    ai_evaluation_prompt TEXT,
    reward_crystals INTEGER DEFAULT 10,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Assessment Results Table with AI Analysis
CREATE TABLE assessment_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    raw_score DECIMAL(5,2),
    percentage_score DECIMAL(5,2),
    ai_feedback TEXT,
    ai_insights JSONB,
    ai_recommendations TEXT,
    personality_traits JSONB,
    strengths_identified JSONB,
    areas_for_improvement JSONB,
    detailed_explanations JSONB,
    processing_time_ms INTEGER,
    ai_model_used TEXT,
    attempt_number INTEGER DEFAULT 1,
    is_passed BOOLEAN,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assessment_id, user_id, attempt_number)
);

-- Quiz Results Table with AI Grading
CREATE TABLE quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    percentage_score DECIMAL(5,2),
    ai_feedback TEXT,
    ai_explanations JSONB,
    detailed_grading JSONB,
    time_taken_seconds INTEGER,
    ai_model_used TEXT,
    attempt_number INTEGER DEFAULT 1,
    is_passed BOOLEAN,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, user_id, attempt_number)
);

-- Challenge Progress Table with AI Tracking
CREATE TABLE challenge_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    progress_data JSONB,
    ai_coaching_messages JSONB,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    ai_feedback_history JSONB,
    ai_motivational_messages JSONB,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- AI Usage Logs Table
CREATE TABLE ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    configuration_id UUID REFERENCES ai_configurations(id),
    user_id UUID REFERENCES user_profiles(id),
    content_type TEXT NOT NULL CHECK (content_type IN ('assessment', 'quiz', 'challenge', 'feedback')),
    content_id UUID,
    api_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    processing_time_ms INTEGER,
    cost_usd DECIMAL(8,6),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    request_payload JSONB,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Assessment Statistics
CREATE TABLE user_assessment_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    total_assessments_completed INTEGER DEFAULT 0,
    total_quizzes_completed INTEGER DEFAULT 0,
    total_challenges_completed INTEGER DEFAULT 0,
    average_assessment_score DECIMAL(5,2),
    average_quiz_score DECIMAL(5,2),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_ai_interactions INTEGER DEFAULT 0,
    favorite_categories JSONB,
    strengths_by_category JSONB,
    improvement_areas JSONB,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_ai_configurations_provider ON ai_configurations(provider);
CREATE INDEX idx_ai_configurations_active ON ai_configurations(is_active);

CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_category ON assessments(category);
CREATE INDEX idx_assessments_public ON assessments(is_public, is_active);
CREATE INDEX idx_assessments_ai ON assessments(is_ai_powered, ai_configuration_id);

CREATE INDEX idx_quizzes_category ON quizzes(category);
CREATE INDEX idx_quizzes_public ON quizzes(is_public, is_active);
CREATE INDEX idx_quizzes_ai ON quizzes(is_ai_powered, ai_configuration_id);

CREATE INDEX idx_challenges_type ON challenges(challenge_type);
CREATE INDEX idx_challenges_category ON challenges(category);
CREATE INDEX idx_challenges_public ON challenges(is_public, is_active);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);

CREATE INDEX idx_assessment_results_user ON assessment_results(user_id);
CREATE INDEX idx_assessment_results_assessment ON assessment_results(assessment_id);
CREATE INDEX idx_assessment_results_completed ON assessment_results(completed_at);

CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_quiz ON quiz_results(quiz_id);
CREATE INDEX idx_quiz_results_completed ON quiz_results(completed_at);

CREATE INDEX idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX idx_challenge_progress_completed ON challenge_progress(is_completed);

CREATE INDEX idx_ai_usage_logs_config ON ai_usage_logs(configuration_id);
CREATE INDEX idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_content ON ai_usage_logs(content_type, content_id);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at);

-- Insert default AI configurations
INSERT INTO ai_configurations (name, description, provider, model_name, temperature, max_tokens, system_prompt) VALUES
('OpenAI GPT-4 Assessment', 'Default configuration for psychological assessments', 'openai', 'gpt-4', 0.7, 1500,
 'You are an expert psychologist and assessment evaluator. Provide detailed, constructive feedback.'),
('OpenAI GPT-3.5 Quiz Grading', 'Fast and accurate quiz grading', 'openai', 'gpt-3.5-turbo', 0.3, 1000,
 'You are a precise quiz grader. Provide accurate scoring and clear explanations.'),
('Claude Challenge Coach', 'Motivational coaching for challenges', 'anthropic', 'claude-3-sonnet-20240229', 0.8, 1200,
 'You are an encouraging life coach. Provide motivational feedback and actionable advice.');

-- Enable Row Level Security
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Configurations (Admin only)
CREATE POLICY "AI configurations are viewable by authenticated users" ON ai_configurations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage AI configurations" ON ai_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

-- RLS Policies for Assessments
CREATE POLICY "Public assessments are viewable by all authenticated users" ON assessments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        (is_public = true OR is_active = true)
    );

CREATE POLICY "Only admins can manage assessments" ON assessments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

-- RLS Policies for Assessment Results (Users can only see their own)
CREATE POLICY "Users can view their own assessment results" ON assessment_results
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

CREATE POLICY "Users can insert their own assessment results" ON assessment_results
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

-- Similar policies for quizzes, challenges, etc.
CREATE POLICY "Public quizzes are viewable by all authenticated users" ON quizzes
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        (is_public = true OR is_active = true)
    );

CREATE POLICY "Only admins can manage quizzes" ON quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

CREATE POLICY "Users can view their own quiz results" ON quiz_results
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

CREATE POLICY "Users can insert their own quiz results" ON quiz_results
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

-- Challenge policies
CREATE POLICY "Public challenges are viewable by all authenticated users" ON challenges
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        (is_public = true OR is_active = true)
    );

CREATE POLICY "Only admins can manage challenges" ON challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

CREATE POLICY "Users can manage their own challenge progress" ON challenge_progress
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

-- AI Usage Logs (Admin only for viewing, system for insertion)
CREATE POLICY "Only admins can view AI usage logs" ON ai_usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

CREATE POLICY "System can insert AI usage logs" ON ai_usage_logs
    FOR INSERT WITH CHECK (true);

-- User Assessment Stats (Users can view their own, admins can view all)
CREATE POLICY "Users can view their own assessment stats" ON user_assessment_stats
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

CREATE POLICY "Only admins can manage assessment stats" ON user_assessment_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

-- Function to calculate assessment statistics
CREATE OR REPLACE FUNCTION update_user_assessment_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    stats_record RECORD;
BEGIN
    -- Calculate statistics
    SELECT
        COUNT(ar.id) as total_assessments,
        COUNT(qr.id) as total_quizzes,
        COUNT(cp.id) FILTER (WHERE cp.is_completed = true) as total_challenges,
        AVG(ar.percentage_score) as avg_assessment_score,
        AVG(qr.percentage_score) as avg_quiz_score,
        COALESCE(MAX(ar.attempt_number), 0) as current_streak,
        COUNT(au.id) as total_ai_interactions
    INTO stats_record
    FROM user_profiles up
    LEFT JOIN assessment_results ar ON ar.user_id = up.id
    LEFT JOIN quiz_results qr ON qr.user_id = up.id
    LEFT JOIN challenge_progress cp ON cp.user_id = up.id AND cp.is_completed = true
    LEFT JOIN ai_usage_logs au ON au.user_id = up.id
    WHERE up.id = p_user_id;

    -- Insert or update statistics
    INSERT INTO user_assessment_stats (
        user_id,
        total_assessments_completed,
        total_quizzes_completed,
        total_challenges_completed,
        average_assessment_score,
        average_quiz_score,
        total_ai_interactions,
        updated_at
    ) VALUES (
        p_user_id,
        stats_record.total_assessments,
        stats_record.total_quizzes,
        stats_record.total_challenges,
        stats_record.avg_assessment_score,
        stats_record.avg_quiz_score,
        stats_record.total_ai_interactions,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_assessments_completed = EXCLUDED.total_assessments_completed,
        total_quizzes_completed = EXCLUDED.total_quizzes_completed,
        total_challenges_completed = EXCLUDED.total_challenges_completed,
        average_assessment_score = EXCLUDED.average_assessment_score,
        average_quiz_score = EXCLUDED.average_quiz_score,
        total_ai_interactions = EXCLUDED.total_ai_interactions,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log AI usage
CREATE OR REPLACE FUNCTION log_ai_usage(
    p_configuration_id UUID,
    p_user_id UUID,
    p_content_type TEXT,
    p_content_id UUID,
    p_api_provider TEXT,
    p_model_name TEXT,
    p_prompt_tokens INTEGER,
    p_completion_tokens INTEGER,
    p_total_tokens INTEGER,
    p_processing_time_ms INTEGER,
    p_cost_usd DECIMAL,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_request_payload JSONB DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO ai_usage_logs (
        configuration_id,
        user_id,
        content_type,
        content_id,
        api_provider,
        model_name,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        processing_time_ms,
        cost_usd,
        success,
        error_message,
        request_payload,
        response_data
    ) VALUES (
        p_configuration_id,
        p_user_id,
        p_content_type,
        p_content_id,
        p_api_provider,
        p_model_name,
        p_prompt_tokens,
        p_completion_tokens,
        p_total_tokens,
        p_processing_time_ms,
        p_cost_usd,
        p_success,
        p_error_message,
        p_request_payload,
        p_response_data
    ) RETURNING id INTO log_id;

    -- Update user statistics
    PERFORM update_user_assessment_stats(p_user_id);

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;