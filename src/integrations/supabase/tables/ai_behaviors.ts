import type { Json } from "../types";

export type AiBehaviors = {
  Row: {
    id: string;
    name: string;
    description: string | null;
    personality_traits: Json | null;
    communication_style: string | null;
    response_length: string | null;
    emotional_tone: string | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    name: string;
    description?: string | null;
    personality_traits?: Json | null;
    communication_style?: string | null;
    response_length?: string | null;
    emotional_tone?: string | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    name?: string;
    description?: string | null;
    personality_traits?: Json | null;
    communication_style?: string | null;
    response_length?: string | null;
    emotional_tone?: string | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};