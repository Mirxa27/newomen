-- Comprehensive fix for all critical database issues
-- Date: 2025-10-07

BEGIN;

-- ============================================================================
-- FIX 1: Fix get_newme_user_context function GROUP BY error
-- ============================================================================

DROP FUNCTION IF EXISTS get_newme_user_context(UUID);

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
    'completed_assessments', (SELECT COALESCE(array_agg(DISTINCT assessment_name), ARRAY[]::TEXT[])
                              FROM newme_assessment_tracking
                              WHERE user_id = p_user_id
                              AND completion_status = 'completed'),
    'emotional_patterns', (SELECT COALESCE(array_agg(DISTINCT subq.memory_value ORDER BY subq.memory_value), ARRAY[]::TEXT[])
                           FROM (
                             SELECT memory_value
                             FROM newme_user_memories
                             WHERE user_id = p_user_id
                             AND memory_type = 'emotional_pattern'
                             AND is_active = true
                             ORDER BY importance_score DESC
                             LIMIT 5
                           ) subq),
    'important_memories', (SELECT COALESCE(jsonb_agg(
                            jsonb_build_object(
                              'type', memory_type,
                              'key', memory_key,
                              'value', memory_value,
                              'context', context
                            )
                          ), '[]'::jsonb)
                          FROM (
                            SELECT memory_type, memory_key, memory_value, context
                            FROM newme_user_memories
                            WHERE user_id = p_user_id
                            AND is_active = true
                            ORDER BY importance_score DESC
                            LIMIT 10
                          ) memories)
  ) INTO context;

  RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX 2: Fix newme_conversations foreign key to reference user_profiles correctly
-- ============================================================================

-- Drop the conflicting table from migration 20251006_3
DROP TABLE IF EXISTS public.newme_conversations CASCADE;

-- The correct table is already created in 20251231000013_newme_memory_system.sql
-- But we need to ensure it exists with proper structure
CREATE TABLE IF NOT EXISTS newme_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Recreate dependent tables
CREATE TABLE IF NOT EXISTS newme_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES newme_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audio_duration_ms INTEGER,
  sentiment_score DECIMAL(3,2),
  emotion_detected TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS newme_user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'personal_detail', 'life_event', 'relationship', 'work_context',
    'emotional_pattern', 'assessment_insight', 'goal', 'preference',
    'achievement', 'challenge'
  )),
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  context TEXT,
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

CREATE TABLE IF NOT EXISTS newme_emotional_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES newme_conversations(id) ON DELETE SET NULL,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  primary_emotion TEXT NOT NULL,
  emotion_intensity DECIMAL(3,2) CHECK (emotion_intensity >= 0 AND emotion_intensity <= 1),
  triggers TEXT[],
  coping_strategies TEXT[],
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS newme_assessment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_name TEXT NOT NULL,
  suggested_in_conversation_id UUID REFERENCES newme_conversations(id),
  suggested_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_status TEXT CHECK (completion_status IN ('suggested', 'started', 'completed', 'abandoned')),
  key_insights TEXT[],
  follow_up_discussed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_newme_conversations_user_id ON newme_conversations(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_newme_conversations_active ON newme_conversations(user_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_newme_messages_conversation ON newme_messages(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_newme_messages_role ON newme_messages(conversation_id, role);
CREATE INDEX IF NOT EXISTS idx_newme_user_memories_user ON newme_user_memories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_newme_user_memories_type ON newme_user_memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_newme_user_memories_importance ON newme_user_memories(user_id, importance_score DESC);

-- ============================================================================
-- FIX 3: Enable RLS and create proper policies
-- ============================================================================

ALTER TABLE newme_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_emotional_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_assessment_tracking ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can manage their own conversations" ON newme_conversations;
DROP POLICY IF EXISTS "Admins have full access to all conversations" ON newme_conversations;

-- Users can manage their own conversations
CREATE POLICY "Users can manage own conversations"
ON newme_conversations FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "Admins can manage all conversations"
ON newme_conversations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'ADMIN'
  )
);

-- Messages policies
DROP POLICY IF EXISTS "Users can manage own messages" ON newme_messages;
CREATE POLICY "Users can manage own messages"
ON newme_messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM newme_conversations
    WHERE newme_conversations.id = newme_messages.conversation_id
    AND newme_conversations.user_id = auth.uid()
  )
);

-- Memories policies
DROP POLICY IF EXISTS "Users can manage own memories" ON newme_user_memories;
CREATE POLICY "Users can manage own memories"
ON newme_user_memories FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Emotional snapshots policies
DROP POLICY IF EXISTS "Users can manage own snapshots" ON newme_emotional_snapshots;
CREATE POLICY "Users can manage own snapshots"
ON newme_emotional_snapshots FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Assessment tracking policies
DROP POLICY IF EXISTS "Users can manage own tracking" ON newme_assessment_tracking;
CREATE POLICY "Users can manage own tracking"
ON newme_assessment_tracking FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FIX 4: Create helper function for incrementing message count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_message_count(conv_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE newme_conversations
  SET message_count = message_count + 1
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
