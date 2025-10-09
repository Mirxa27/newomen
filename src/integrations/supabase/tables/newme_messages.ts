import type { Json } from "../types";

export type NewmeMessages = {
  Row: {
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    timestamp: string | null;
    audio_duration_ms: number | null;
    sentiment_score: number | null;
    emotion_detected: string | null;
    metadata: Json | null;
  };
  Insert: {
    id?: string;
    conversation_id: string;
    role: string;
    content: string;
    timestamp?: string | null;
    audio_duration_ms?: number | null;
    sentiment_score?: number | null;
    emotion_detected?: string | null;
    metadata?: Json | null;
  };
  Update: {
    id?: string;
    conversation_id?: string;
    role?: string;
    content?: string;
    timestamp?: string | null;
    audio_duration_ms?: number | null;
    sentiment_score?: number | null;
    emotion_detected?: string | null;
    metadata?: Json | null;
  };
  Relationships: [];
};