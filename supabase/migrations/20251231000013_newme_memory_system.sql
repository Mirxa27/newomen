-- NewMe Voice Agent Memory System
-- Creates tables for storing user-specific memories and conversation context

-- Main conversation sessions table
CREATE TABLE IF NOT EXISTS newme_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  topics_discussed TEXT[],
  emotional_tone TEXT,
  suggested_assessments TEXT[],
  key_insights TEXT[],
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual messages within conversations
CREATE TABLE IF NOT EXISTS newme_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES newme_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audio_duration_ms INTEGER,
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  emotion_detected TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User-specific memories that persist across conversations
CREATE TABLE IF NOT EXISTS newme_user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'personal_detail',        -- Name, nickname, preferences
    'life_event',             -- Important dates, milestones
    'relationship',           -- Family, friends, partners mentioned
    'work_context',           -- Job, projects, career goals
    'emotional_pattern',      -- Recurring feelings or challenges
    'assessment_insight',     -- Key takeaways from assessments
    'goal',                   -- User's stated goals
    'preference',             -- Communication style, topics they enjoy
    'achievement',            -- Wins they've shared
    'challenge'               -- Ongoing struggles or concerns
  )),
  memory_key TEXT NOT NULL,   -- e.g., 'nickname', 'mother_name', 'current_project'
  memory_value TEXT NOT NULL,
  context TEXT,               -- Additional context about this memory
  importance_score INTEGER DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
  first_mentioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_referenced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reference_count INTEGER DEFAULT 1,
  source_conversation_id UUID REFERENCES newme_conversations(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emotional journey tracking
CREATE TABLE IF NOT EXISTS newme_emotional_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES newme_conversations(id) ON DELETE SET NULL,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  primary_emotion TEXT NOT NULL,
  emotion_intensity DECIMAL(3,2) CHECK (emotion_intensity >= 0 AND emotion_intensity <= 1),
  triggers TEXT[],
  coping_strategies TEXT[],
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Assessment completion tracking (linked to NewMe suggestions)
CREATE TABLE IF NOT EXISTS newme_assessment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assessment_name TEXT NOT NULL,
  suggested_in_conversation_id UUID REFERENCES newme_conversations(id),
  suggested_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_status TEXT CHECK (completion_status IN ('suggested', 'started', 'completed', 'abandoned')),
  key_insights TEXT[],
  follow_up_discussed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_newme_conversations_user_id ON newme_conversations(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_newme_conversations_active ON newme_conversations(user_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_newme_messages_conversation ON newme_messages(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_newme_messages_role ON newme_messages(conversation_id, role);
CREATE INDEX IF NOT EXISTS idx_newme_user_memories_user ON newme_user_memories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_newme_user_memories_type ON newme_user_memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_newme_user_memories_importance ON newme_user_memories(user_id, importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_newme_emotional_snapshots_user ON newme_emotional_snapshots(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_newme_assessment_tracking_user ON newme_assessment_tracking(user_id, suggested_at DESC);

-- Enable Row Level Security
ALTER TABLE newme_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_emotional_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_assessment_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for newme_conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON newme_conversations;
CREATE POLICY "Users can view their own conversations"
  ON newme_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own conversations" ON newme_conversations;
CREATE POLICY "Users can insert their own conversations"
  ON newme_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own conversations" ON newme_conversations;
CREATE POLICY "Users can update their own conversations"
  ON newme_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for newme_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON newme_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON newme_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM newme_conversations
      WHERE newme_conversations.id = newme_messages.conversation_id
      AND newme_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON newme_messages;
CREATE POLICY "Users can insert messages in their conversations"
  ON newme_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM newme_conversations
      WHERE newme_conversations.id = newme_messages.conversation_id
      AND newme_conversations.user_id = auth.uid()
    )
  );

-- RLS Policies for newme_user_memories
DROP POLICY IF EXISTS "Users can view their own memories" ON newme_user_memories;
CREATE POLICY "Users can view their own memories"
  ON newme_user_memories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own memories" ON newme_user_memories;
CREATE POLICY "Users can insert their own memories"
  ON newme_user_memories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own memories" ON newme_user_memories;
CREATE POLICY "Users can update their own memories"
  ON newme_user_memories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own memories" ON newme_user_memories;
CREATE POLICY "Users can delete their own memories"
  ON newme_user_memories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for newme_emotional_snapshots
DROP POLICY IF EXISTS "Users can manage their emotional snapshots" ON newme_emotional_snapshots;
CREATE POLICY "Users can manage their emotional snapshots"
  ON newme_emotional_snapshots FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for newme_assessment_tracking
DROP POLICY IF EXISTS "Users can manage their assessment tracking" ON newme_assessment_tracking;
CREATE POLICY "Users can manage their assessment tracking"
  ON newme_assessment_tracking FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin policies (full access)
DROP POLICY IF EXISTS "Admins can view all conversations" ON newme_conversations;
CREATE POLICY "Admins can view all conversations"
  ON newme_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all memories" ON newme_user_memories;
CREATE POLICY "Admins can view all memories"
  ON newme_user_memories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_newme_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_newme_user_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.last_referenced_at = CURRENT_TIMESTAMP;
  NEW.reference_count = NEW.reference_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS newme_conversations_updated_at ON newme_conversations;
DROP TRIGGER IF EXISTS newme_user_memories_updated_at ON newme_user_memories;

-- Create triggers
CREATE TRIGGER newme_conversations_updated_at
  BEFORE UPDATE ON newme_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_newme_conversations_updated_at();

CREATE TRIGGER newme_user_memories_updated_at
  BEFORE UPDATE ON newme_user_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_newme_user_memories_updated_at();

-- Helper function to get recent user context for NewMe
CREATE OR REPLACE FUNCTION get_newme_user_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'nickname', (SELECT memory_value FROM newme_user_memories
                 WHERE user_id = p_user_id
                 AND memory_type = 'personal_detail'
                 AND memory_key = 'nickname'
                 AND is_active = true
                 LIMIT 1),
    'last_conversation_date', (SELECT started_at FROM newme_conversations
                                WHERE user_id = p_user_id
                                ORDER BY started_at DESC
                                LIMIT 1 OFFSET 1),
    'last_conversation_topic', (SELECT summary FROM newme_conversations
                                 WHERE user_id = p_user_id
                                 ORDER BY started_at DESC
                                 LIMIT 1 OFFSET 1),
    'completed_assessments', (SELECT COALESCE(array_agg(assessment_name), ARRAY[]::TEXT[])
                              FROM newme_assessment_tracking
                              WHERE user_id = p_user_id
                              AND completion_status = 'completed'),
    'emotional_patterns', (SELECT COALESCE(array_agg(memory_value), ARRAY[]::TEXT[])
                           FROM newme_user_memories
                           WHERE user_id = p_user_id
                           AND memory_type = 'emotional_pattern'
                           AND is_active = true
                           ORDER BY importance_score DESC
                           LIMIT 5),
    'important_memories', (SELECT COALESCE(jsonb_agg(
                            jsonb_build_object(
                              'type', memory_type,
                              'key', memory_key,
                              'value', memory_value,
                              'context', context
                            )
                          ), '[]'::jsonb)
                          FROM newme_user_memories
                          WHERE user_id = p_user_id
                          AND is_active = true
                          ORDER BY importance_score DESC
                          LIMIT 10)
  ) INTO context;

  RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE newme_conversations IS 'Stores NewMe voice conversation sessions with metadata and insights';
COMMENT ON TABLE newme_messages IS 'Individual messages within NewMe conversations';
COMMENT ON TABLE newme_user_memories IS 'Persistent user-specific memories that NewMe maintains across conversations';
COMMENT ON TABLE newme_emotional_snapshots IS 'Tracks user emotional journey over time';
COMMENT ON TABLE newme_assessment_tracking IS 'Links NewMe assessment suggestions to completion and follow-up';

COMMENT ON COLUMN newme_user_memories.importance_score IS 'Scale of 1-10, where 10 is most important for NewMe to remember';
COMMENT ON COLUMN newme_user_memories.reference_count IS 'How many times this memory has been referenced in conversations';
COMMENT ON COLUMN newme_emotional_snapshots.emotion_intensity IS 'Scale of 0.00 to 1.00, where 1.00 is highest intensity';

-- Sample data for testing (optional - remove in production)
-- This helps developers understand the structure
/*
INSERT INTO newme_user_memories (user_id, memory_type, memory_key, memory_value, context, importance_score)
VALUES
  ('user-uuid-here', 'personal_detail', 'nickname', 'Sarah', 'Prefers to be called Sarah instead of Sarah Jane', 10),
  ('user-uuid-here', 'emotional_pattern', 'work_stress', 'Experiences anxiety about work-life balance', 'Recurring theme in conversations', 8),
  ('user-uuid-here', 'goal', 'career_transition', 'Wants to transition from corporate to entrepreneurship', 'Mentioned in first 3 conversations', 9);
*/
