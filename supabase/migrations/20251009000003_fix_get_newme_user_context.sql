-- Fix the get_newme_user_context function to properly handle importance_score in queries
CREATE OR REPLACE FUNCTION get_newme_user_context(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  context JSON;
BEGIN
  SELECT json_build_object(
    'user_profile', (SELECT json_build_object(
      'nickname', nickname,
      'subscription_tier', subscription_tier,
      'remaining_minutes', remaining_minutes,
      'current_level', current_level,
      'crystal_balance', crystal_balance
    )
    FROM user_profiles
    WHERE user_id = p_user_id),

    'recent_conversation', (SELECT json_build_object(
      'id', id,
      'title', title,
      'summary', summary,
      'started_at', started_at
    )
    FROM newme_conversations
    WHERE user_id = p_user_id
    ORDER BY started_at DESC
    LIMIT 1),

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
                           ORDER BY importance_score DESC NULLS LAST
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
                          ORDER BY importance_score DESC NULLS LAST
                          LIMIT 10)
  ) INTO context;

  RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
