import type { Json } from "../types";

export type UserMemoryProfiles = {
  Row: {
    id: string;
    user_id: string | null;
    personality_type: string | null;
    balance_wheel_scores: Json | null;
    narrative_patterns: Json | null;
    emotional_state_history: Json | null;
    created_at: string | null;
    updated_at: string | null;
    narrative_identity_data: Json | null;
  };
  Insert: {
    id?: string;
    user_id?: string | null;
    personality_type?: string | null;
    balance_wheel_scores?: Json | null;
    narrative_patterns?: Json | null;
    emotional_state_history?: Json | null;
    created_at?: string | null;
    updated_at?: string | null;
    narrative_identity_data?: Json | null;
  };
  Update: {
    id?: string;
    user_id?: string | null;
    personality_type?: string | null;
    balance_wheel_scores?: Json | null;
    narrative_patterns?: Json | null;
    emotional_state_history?: Json | null;
    created_at?: string | null;
    updated_at?: string | null;
    narrative_identity_data?: Json | null;
  };
  Relationships: [];
};