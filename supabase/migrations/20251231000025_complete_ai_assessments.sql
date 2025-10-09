-- Complete AI-Powered Assessments, Quizzes, and Challenges Migration
-- This completes the RLS policies and adds missing functionality

-- Complete RLS Policies for AI Configurations
DROP POLICY IF EXISTS "AI configurations are viewable by authenticated users" ON ai_configurations;
CREATE POLICY "AI configurations are viewable by authenticated users" ON ai_configurations
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage AI configurations" ON ai_configurations;
CREATE POLICY "Only admins can manage AI configurations" ON ai_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- RLS Policies for Assessments
DROP POLICY IF EXISTS "Assessments are viewable by everyone" ON assessments;
CREATE POLICY "Assessments are viewable by everyone" ON assessments
    FOR SELECT USING (is_public = true OR is_active = true);

DROP POLICY IF EXISTS "Assessments are viewable by authenticated users" ON assessments;
CREATE POLICY "Assessments are viewable by authenticated users" ON assessments
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage assessments" ON assessments;
CREATE POLICY "Only admins can manage assessments" ON assessments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- RLS Policies for Quizzes
DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;
CREATE POLICY "Quizzes are viewable by everyone" ON quizzes
    FOR SELECT USING (is_public = true OR is_active = true);

DROP POLICY IF EXISTS "Quizzes are viewable by authenticated users" ON quizzes;
CREATE POLICY "Quizzes are viewable by authenticated users" ON quizzes
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage quizzes" ON quizzes;
CREATE POLICY "Only admins can manage quizzes" ON quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- RLS Policies for Challenges
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON challenges;
CREATE POLICY "Challenges are viewable by everyone" ON challenges
    FOR SELECT USING (is_public = true OR is_active = true);

DROP POLICY IF EXISTS "Challenges are viewable by authenticated users" ON challenges;
CREATE POLICY "Challenges are viewable by authenticated users" ON challenges
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage challenges" ON challenges;
CREATE POLICY "Only admins can manage challenges" ON challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- RLS Policies for Assessment Results
DROP POLICY IF EXISTS "Users can view their own assessment results" ON assessment_results;
CREATE POLICY "Users can view their own assessment results" ON assessment_results
    FOR SELECT USING (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert their own assessment results" ON assessment_results;
CREATE POLICY "Users can insert their own assessment results" ON assessment_results
    FOR INSERT WITH CHECK (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Admins can view all assessment results" ON assessment_results;
CREATE POLICY "Admins can view all assessment results" ON assessment_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- RLS Policies for Quiz Results
DROP POLICY IF EXISTS "Users can view their own quiz results" ON quiz_results;
CREATE POLICY "Users can view their own quiz results" ON quiz_results
    FOR SELECT USING (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert their own quiz results" ON quiz_results;
CREATE POLICY "Users can insert their own quiz results" ON quiz_results
    FOR INSERT WITH CHECK (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Admins can view all quiz results" ON quiz_results;
CREATE POLICY "Admins can view all quiz results" ON quiz_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- RLS Policies for Challenge Progress
DROP POLICY IF EXISTS "Users can view their own challenge progress" ON challenge_progress;
CREATE POLICY "Users can view their own challenge progress" ON challenge_progress
    FOR SELECT USING (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can manage their own challenge progress" ON challenge_progress;
CREATE POLICY "Users can manage their own challenge progress" ON challenge_progress
    FOR ALL USING (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Admins can view all challenge progress" ON challenge_progress;
CREATE POLICY "Admins can view all challenge progress" ON challenge_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- RLS Policies for AI Usage Logs
DROP POLICY IF EXISTS "Users can view their own AI usage logs" ON ai_usage_logs;
CREATE POLICY "Users can view their own AI usage logs" ON ai_usage_logs
    FOR SELECT USING (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Admins can view all AI usage logs" ON ai_usage_logs;
CREATE POLICY "Admins can view all AI usage logs" ON ai_usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- RLS Policies for User Assessment Stats
DROP POLICY IF EXISTS "Users can view their own assessment stats" ON user_assessment_stats;
CREATE POLICY "Users can view their own assessment stats" ON user_assessment_stats
    FOR SELECT USING (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update their own assessment stats" ON user_assessment_stats;
CREATE POLICY "Users can update their own assessment stats" ON user_assessment_stats
    FOR UPDATE USING (user_id = (
        SELECT id FROM user_profiles WHERE user_profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Admins can view all assessment stats" ON user_assessment_stats;
CREATE POLICY "Admins can view all assessment stats" ON user_assessment_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
            AND COALESCE(user_profiles.role, user_profiles.subscription_tier) IN ('admin', 'ADMIN')
        )
    );

-- Create additional indexes for performance
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'assessment_type'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assessments_type_category ON assessments(assessment_type, category)';
  ELSE
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assessments_type_category ON assessments(type, category)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_assessments_difficulty ON assessments(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_assessments_created ON assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON quizzes(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_quizzes_time_limit ON quizzes(time_limit_minutes);
CREATE INDEX IF NOT EXISTS idx_quizzes_created ON quizzes(created_at);

CREATE INDEX IF NOT EXISTS idx_challenges_duration ON challenges(duration_days);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_challenges_created ON challenges(created_at);

CREATE INDEX IF NOT EXISTS idx_assessment_results_score ON assessment_results(percentage_score);
CREATE INDEX IF NOT EXISTS idx_assessment_results_attempt ON assessment_results(attempt_number);

CREATE INDEX IF NOT EXISTS idx_quiz_results_score ON quiz_results(percentage_score);
CREATE INDEX IF NOT EXISTS idx_quiz_results_time ON quiz_results(time_taken_seconds);
CREATE INDEX IF NOT EXISTS idx_quiz_results_attempt ON quiz_results(attempt_number);

CREATE INDEX IF NOT EXISTS idx_challenge_progress_streak ON challenge_progress(current_streak);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_completions ON challenge_progress(total_completions);

-- Create functions for automatic stats updates
CREATE OR REPLACE FUNCTION update_user_assessment_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_assessment_stats (
        user_id,
        total_assessments_completed,
        average_assessment_score,
        last_activity_date,
        updated_at
    )
    VALUES (
        NEW.user_id,
        1,
        NEW.percentage_score,
        NEW.completed_at,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_assessments_completed = user_assessment_stats.total_assessments_completed + 1,
        average_assessment_score = (
            (user_assessment_stats.average_assessment_score * user_assessment_stats.total_assessments_completed + NEW.percentage_score) /
            (user_assessment_stats.total_assessments_completed + 1)
        ),
        last_activity_date = NEW.completed_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_assessment_stats
    AFTER INSERT ON assessment_results
    FOR EACH ROW
    EXECUTE FUNCTION update_user_assessment_stats();

-- Create function for quiz stats updates
CREATE OR REPLACE FUNCTION update_user_quiz_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_assessment_stats (
        user_id,
        total_quizzes_completed,
        average_quiz_score,
        last_activity_date,
        updated_at
    )
    VALUES (
        NEW.user_id,
        1,
        NEW.percentage_score,
        NEW.completed_at,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_quizzes_completed = user_assessment_stats.total_quizzes_completed + 1,
        average_quiz_score = (
            (user_assessment_stats.average_quiz_score * user_assessment_stats.total_quizzes_completed + NEW.percentage_score) /
            (user_assessment_stats.total_quizzes_completed + 1)
        ),
        last_activity_date = NEW.completed_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_quiz_stats
    AFTER INSERT ON quiz_results
    FOR EACH ROW
    EXECUTE FUNCTION update_user_quiz_stats();

-- Create function for challenge stats updates
CREATE OR REPLACE FUNCTION update_user_challenge_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_assessment_stats (
        user_id,
        total_challenges_completed,
        last_activity_date,
        updated_at
    )
    VALUES (
        NEW.user_id,
        1,
        NEW.completed_at,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_challenges_completed = user_assessment_stats.total_challenges_completed + 1,
        last_activity_date = NEW.completed_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_challenge_stats
    AFTER UPDATE ON challenge_progress
    FOR EACH ROW
    WHEN (NEW.is_completed = true AND OLD.is_completed = false)
    EXECUTE FUNCTION update_user_challenge_stats();

-- Add updated_at trigger for several tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_configurations_updated_at
    BEFORE UPDATE ON ai_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_assessment_stats_updated_at
    BEFORE UPDATE ON user_assessment_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
