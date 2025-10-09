import type { Json } from "../types";

export type NewmeMessages = {
  Row: {
    id: string;
    conversation_id: string;
    sender: "user" | "assistant" | "system"; // Explicitly define enum values
    text_content: string | null;
    audio_url: string | null;
    emotion_data: Json | null;
    ts: string;
    sentiment_score: number | null; // Added missing column
    emotion_detected: string | null; // Added missing column
  };
  Insert: {
    id?: string;
    conversation_id: string;
    sender: "user" | "assistant" | "system";
    text_content?: string | null;
    audio_url?: string | null;
    emotion_data?: Json | null;
    ts?: string;
    sentiment_score?: number | null;
    emotion_detected?: string | null;
  };
  Update: {
    id?: string;
    conversation_id?: string;
    sender?: "user" | "assistant" | "system";
    text_content?: string | null;
    audio_url?: string | null;
    emotion_data?: Json | null;
    ts?: string;
    sentiment_score?: number | null;
    emotion_detected?: string | null;
  };
  Relationships: [];
};