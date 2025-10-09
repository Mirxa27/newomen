import type { Json } from "../types";

export type NewmeEmotionalSnapshots = {
  Row: {
    id: string;
    user_id: string;
    conversation_id: string | null;
    timestamp: string;
    emotional_state: Json;
    sentiment_score: number | null;
    dominant_emotion: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    conversation_id?: string | null;
    timestamp?: string;
    emotional_state: Json;
    sentiment_score?: number | null;
    dominant_emotion?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    conversation_id?: string | null;
    timestamp?: string;
    emotional_state?: Json;
    sentiment_score?: number | null;
    dominant_emotion?: string | null;
    created_at?: string;
  };
  Relationships: [];
};