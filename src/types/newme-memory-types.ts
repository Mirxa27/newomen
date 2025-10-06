/**
 * NewMe Memory System Types
 * TypeScript interfaces for NewMe's user-based memory and conversation tracking
 */

export type NewMeMessageRole = 'user' | 'assistant' | 'system';

export type NewMeMemoryType =
  | 'personal_detail'
  | 'life_event'
  | 'relationship'
  | 'work_context'
  | 'emotional_pattern'
  | 'assessment_insight'
  | 'goal'
  | 'preference'
  | 'achievement'
  | 'challenge';

export type AssessmentCompletionStatus = 'suggested' | 'started' | 'completed' | 'abandoned';

export interface NewMeConversation {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  message_count: number;
  topics_discussed?: string[];
  emotional_tone?: string;
  suggested_assessments?: string[];
  key_insights?: string[];
  summary?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NewMeMessage {
  id: string;
  conversation_id: string;
  role: NewMeMessageRole;
  content: string;
  timestamp: string;
  audio_duration_ms?: number;
  sentiment_score?: number; // -1.00 to 1.00
  emotion_detected?: string;
  metadata?: Record<string, unknown>;
}

export interface NewMeUserMemory {
  id: string;
  user_id: string;
  memory_type: NewMeMemoryType;
  memory_key: string;
  memory_value: string;
  context?: string;
  importance_score: number; // 1-10
  first_mentioned_at: string;
  last_referenced_at: string;
  reference_count: number;
  source_conversation_id?: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NewMeEmotionalSnapshot {
  id: string;
  user_id: string;
  conversation_id?: string;
  snapshot_date: string;
  primary_emotion: string;
  emotion_intensity: number; // 0.00 to 1.00
  triggers?: string[];
  coping_strategies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface NewMeAssessmentTracking {
  id: string;
  user_id: string;
  assessment_name: string;
  suggested_in_conversation_id?: string;
  suggested_at?: string;
  completed_at?: string;
  completion_status: AssessmentCompletionStatus;
  key_insights?: string[];
  follow_up_discussed: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * User context returned by get_newme_user_context() database function
 */
export interface NewMeUserContext {
  nickname?: string;
  last_conversation_date?: string;
  last_conversation_topic?: string;
  completed_assessments?: string[];
  emotional_patterns?: string[];
  important_memories?: Array<{
    type: string;
    key: string;
    value: string;
    context?: string;
  }>;
}export interface CreateMemoryInput {
  user_id: string;
  memory_type: NewMeMemoryType;
  memory_key: string;
  memory_value: string;
  context?: string;
  importance_score?: number;
  source_conversation_id?: string;
}

export interface CreateConversationInput {
  user_id: string;
  topics_discussed?: string[];
  emotional_tone?: string;
}

export interface UpdateConversationInput {
  ended_at?: string;
  duration_seconds?: number;
  message_count?: number;
  topics_discussed?: string[];
  emotional_tone?: string;
  suggested_assessments?: string[];
  key_insights?: string[];
  summary?: string;
}

export interface CreateMessageInput {
  conversation_id: string;
  role: NewMeMessageRole;
  content: string;
  audio_duration_ms?: number;
  sentiment_score?: number;
  emotion_detected?: string;
}

export interface CreateEmotionalSnapshotInput {
  user_id: string;
  conversation_id?: string;
  primary_emotion: string;
  emotion_intensity: number;
  triggers?: string[];
  coping_strategies?: string[];
  notes?: string;
}

export interface UpdateAssessmentTrackingInput {
  completion_status: AssessmentCompletionStatus;
  completed_at?: string;
  key_insights?: string[];
  follow_up_discussed?: boolean;
}
