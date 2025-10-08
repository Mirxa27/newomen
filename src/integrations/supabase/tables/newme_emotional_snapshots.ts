import type { Json } from "../types";

export type NewmeEmotionalSnapshots = {
  Row: {
    id: string;
    user_id: string;
    conversation_id: string | null;
    snapshot_date: string | null;
    primary_emotion: string;
    emotion_intensity: number | null;
    triggers: string[] | null;
    coping_strategies: string[] | null;
    notes: string | null;
    metadata: Json | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    conversation_id?: string | null;
    snapshot_date?: string | null;
    primary_emotion: string;
    emotion_intensity?: number | null;
    triggers?: string[] | null;
    coping_strategies?: string[] | null;
    notes?: string | null;
    metadata?: Json | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    conversation_id?: string | null;
    snapshot_date?: string | null;
    primary_emotion?: string;
    emotion_intensity?: number | null;
    triggers?: string[] | null;
    coping_strategies?: string[] | null;
    notes?: string | null;
    metadata?: Json | null;
  };
  Relationships: [];
};