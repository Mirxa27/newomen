import type { Json } from "../types";

export type AssessmentsEnhanced = {
  Row: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    category: string;
    difficulty_level: string;
    time_limit_minutes: number | null;
    questions: Json;
    passing_score: number | null;
    ai_config_id: string | null;
    is_public: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    title: string;
    description?: string | null;
    type: string;
    category: string;
    difficulty_level: string;
    time_limit_minutes?: number | null;
    questions: Json;
    passing_score?: number | null;
    ai_config_id?: string | null;
    is_public?: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    title?: string;
    description?: string | null;
    type?: string;
    category?: string;
    difficulty_level?: string;
    time_limit_minutes?: number | null;
    questions?: Json;
    passing_score?: number | null;
    ai_config_id?: string | null;
    is_public?: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};