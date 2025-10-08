import type { Json } from "../types";

export type NewmeConversations = {
  Row: {
    id: string;
    user_id: string;
    started_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    message_count: number | null;
    topics_discussed: string[] | null;
    emotional_tone: string | null;
    suggested_assessments: string[] | null;
    key_insights: string[] | null;
    summary: string | null;
    metadata: Json | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    started_at?: string | null;
    ended_at?: string | null;
    duration_seconds?: number | null;
    message_count?: number | null;
    topics_discussed?: string[] | null;
    emotional_tone?: string | null;
    suggested_assessments?: string[] | null;
    key_insights?: string[] | null;
    summary?: string | null;
    metadata?: Json | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    started_at?: string | null;
    ended_at?: string | null;
    duration_seconds?: number | null;
    message_count?: number | null;
    topics_discussed?: string[] | null;
    emotional_tone?: string | null;
    suggested_assessments?: string[] | null;
    key_insights?: string[] | null;
    summary?: string | null;
    metadata?: Json | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};