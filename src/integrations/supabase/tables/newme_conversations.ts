import type { Json } from "../types"; // Ensure Json is imported

export type NewmeConversations = {
  Row: {
    id: string;
    user_id: string;
    agent_id: string | null;
    title: string | null;
    created_at: string;
    updated_at: string;
    last_message_at: string | null;
    message_count: number;
    emotional_tone: string | null; // Added missing column
    topics_discussed: Json | null; // Added missing column
    ended_at: string | null; // Added missing column
  };
  Insert: {
    id?: string;
    user_id: string;
    agent_id?: string | null;
    title?: string | null;
    created_at?: string;
    updated_at?: string;
    last_message_at?: string | null;
    message_count?: number;
    emotional_tone?: string | null;
    topics_discussed?: Json | null;
    ended_at?: string | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    agent_id?: string | null;
    title?: string | null;
    created_at?: string;
    updated_at?: string;
    last_message_at?: string | null;
    message_count?: number;
    emotional_tone?: string | null;
    topics_discussed?: Json | null;
    ended_at?: string | null;
  };
  Relationships: [];
};