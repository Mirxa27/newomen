-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  badge_url TEXT,
  category TEXT,
  unlock_criteria JSONB NOT NULL,
  crystal_reward INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress_data JSONB,
  UNIQUE(user_id, achievement_id)
);

-- Create crystal_transactions table
CREATE TABLE IF NOT EXISTS public.crystal_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'penalty')),
  source TEXT NOT NULL,
  description TEXT,
  related_entity_id UUID,
  related_entity_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create level_thresholds table
CREATE TABLE IF NOT EXISTS public.level_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER UNIQUE NOT NULL,
  crystals_required INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  rewards JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crystal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Anyone can view active achievements"
  ON public.achievements
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user achievements"
  ON public.user_achievements
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for crystal_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.crystal_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.crystal_transactions
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for level_thresholds
CREATE POLICY "Anyone can view level thresholds"
  ON public.level_thresholds
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage level thresholds"
  ON public.level_thresholds
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON public.achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_crystal_transactions_user_id ON public.crystal_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crystal_transactions_type ON public.crystal_transactions(type);
CREATE INDEX IF NOT EXISTS idx_level_thresholds_level ON public.level_thresholds(level);

-- Add update timestamp triggers
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_level_thresholds_updated_at
  BEFORE UPDATE ON public.level_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievements
INSERT INTO public.achievements (title, description, badge_url, category, unlock_criteria, crystal_reward) VALUES
(
  'First Steps',
  'Complete your first assessment',
  '/badges/first-steps.svg',
  'assessment',
  '{"type": "assessment_completion", "count": 1}',
  10
),
(
  'Explorer',
  'Complete 5 different assessments',
  '/badges/explorer.svg',
  'assessment',
  '{"type": "assessment_completion", "count": 5, "unique": true}',
  25
),
(
  'Conversationalist',
  'Have your first conversation with NewMe',
  '/badges/conversationalist.svg',
  'chat',
  '{"type": "conversation_completion", "count": 1}',
  15
),
(
  'Deep Talker',
  'Complete 10 conversations',
  '/badges/deep-talker.svg',
  'chat',
  '{"type": "conversation_completion", "count": 10}',
  50
),
(
  'Daily Devotion',
  'Log in for 7 consecutive days',
  '/badges/daily-devotion.svg',
  'engagement',
  '{"type": "daily_streak", "count": 7}',
  20
),
(
  'Committed',
  'Maintain a 30-day streak',
  '/badges/committed.svg',
  'engagement',
  '{"type": "daily_streak", "count": 30}',
  100
),
(
  'Self-Discoverer',
  'Complete the Narrative Identity Exploration',
  '/badges/self-discoverer.svg',
  'exploration',
  '{"type": "narrative_completion", "count": 1}',
  30
),
(
  'Partner in Growth',
  'Complete your first Couple''s Challenge',
  '/badges/partner-growth.svg',
  'community',
  '{"type": "couples_challenge", "count": 1}',
  25
),
(
  'Crystal Collector',
  'Accumulate 500 crystals',
  '/badges/crystal-collector.svg',
  'gamification',
  '{"type": "crystal_balance", "amount": 500}',
  50
),
(
  'Level Up',
  'Reach level 5',
  '/badges/level-up.svg',
  'gamification',
  '{"type": "level", "level": 5}',
  75
),
(
  'Wellness Warrior',
  'Complete 5 wellness resources',
  '/badges/wellness-warrior.svg',
  'wellness',
  '{"type": "wellness_completion", "count": 5}',
  30
),
(
  'Community Builder',
  'Make 3 connections',
  '/badges/community-builder.svg',
  'community',
  '{"type": "connections", "count": 3}',
  40
);

-- Insert default level thresholds
INSERT INTO public.level_thresholds (level, crystals_required, title, description, rewards) VALUES
(1, 0, 'Newcomer', 'Just starting your journey with Newomen', '{"crystals": 0, "features": ["basic_chat"]}'),
(2, 50, 'Explorer', 'Beginning to discover your potential', '{"crystals": 10, "features": ["basic_chat", "assessments"]}'),
(3, 150, 'Seeker', 'Actively pursuing personal growth', '{"crystals": 25, "features": ["basic_chat", "assessments", "community"]}'),
(4, 300, 'Achiever', 'Making significant progress', '{"crystals": 50, "features": ["basic_chat", "assessments", "community", "wellness_library"]}'),
(5, 500, 'Growth Champion', 'Demonstrating commitment to growth', '{"crystals": 100, "features": ["basic_chat", "assessments", "community", "wellness_library", "couples_challenge"]}'),
(6, 750, 'Wisdom Seeker', 'Deepening self-understanding', '{"crystals": 150, "features": ["basic_chat", "assessments", "community", "wellness_library", "couples_challenge", "advanced_analytics"]}'),
(7, 1000, 'Transformation Leader', 'Inspiring others through growth', '{"crystals": 200, "features": ["basic_chat", "assessments", "community", "wellness_library", "couples_challenge", "advanced_analytics", "premium_content"]}'),
(8, 1500, 'Enlightened', 'Master of personal transformation', '{"crystals": 300, "features": ["all_features", "priority_support", "exclusive_content"]}'),
(9, 2000, 'Newomen Master', 'Exemplifying personal growth excellence', '{"crystals": 500, "features": ["all_features", "priority_support", "exclusive_content", "early_access"]}'),
(10, 3000, 'Legend', 'Achieving extraordinary transformation', '{"crystals": 1000, "features": ["all_features", "lifetime_benefits", "recognition"]}');

-- Create function to award crystals
CREATE OR REPLACE FUNCTION public.award_crystals(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_related_entity_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current crystal balance
  SELECT crystal_balance INTO current_balance
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  
  -- Update crystal balance
  UPDATE public.user_profiles
  SET crystal_balance = crystal_balance + p_amount
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.crystal_transactions (
    user_id, amount, type, source, description, related_entity_id, related_entity_type
  ) VALUES (
    p_user_id, p_amount, 'earned', p_source, p_description, p_related_entity_id, p_related_entity_type
  );
  
  -- Check for level up
  new_level := (
    SELECT COALESCE(MAX(level), 1)
    FROM public.level_thresholds
    WHERE crystals_required <= (current_balance + p_amount)
  );
  
  -- Update user level if they've leveled up
  UPDATE public.user_profiles
  SET current_level = new_level
  WHERE user_id = p_user_id AND current_level < new_level;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  achievement_record RECORD;
  should_award BOOLEAN;
BEGIN
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    WHERE is_active = true 
    AND id NOT IN (
      SELECT achievement_id FROM public.user_achievements 
      WHERE user_id = p_user_id
    )
  LOOP
    should_award := false;
    
    -- Check different achievement types
    CASE achievement_record.unlock_criteria->>'type'
      WHEN 'assessment_completion' THEN
        should_award := (
          SELECT COUNT(DISTINCT assessment_id) >= (achievement_record.unlock_criteria->>'count')::INTEGER
          FROM public.assessment_results
          WHERE user_id = p_user_id
        );
      
      WHEN 'conversation_completion' THEN
        should_award := (
          SELECT COUNT(*) >= (achievement_record.unlock_criteria->>'count')::INTEGER
          FROM public.conversations
          WHERE user_id = p_user_id AND status = 'ended'
        );
      
      WHEN 'daily_streak' THEN
        should_award := (
          SELECT daily_streak >= (achievement_record.unlock_criteria->>'count')::INTEGER
          FROM public.user_profiles
          WHERE user_id = p_user_id
        );
      
      WHEN 'crystal_balance' THEN
        should_award := (
          SELECT crystal_balance >= (achievement_record.unlock_criteria->>'amount')::INTEGER
          FROM public.user_profiles
          WHERE user_id = p_user_id
        );
      
      WHEN 'level' THEN
        should_award := (
          SELECT current_level >= (achievement_record.unlock_criteria->>'level')::INTEGER
          FROM public.user_profiles
          WHERE user_id = p_user_id
        );
    END CASE;
    
    -- Award achievement if criteria met
    IF should_award THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (p_user_id, achievement_record.id);
      
      -- Award crystal reward
      PERFORM public.award_crystals(
        p_user_id, 
        achievement_record.crystal_reward, 
        'achievement', 
        'Achievement unlocked: ' || achievement_record.title,
        achievement_record.id,
        'achievement'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
