import type { Json } from "../types";

export type NewmeUserMemories = {
  Row: {
    id: string;
    user_id: string;
    memory_value: string;
    context: string | null;
    importance_score: number | null;
    last_referenced_at: string | null;
    reference_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    memory_value: string;
    context?: string | null;
    importance_score?: number | null;
    last_referenced_at?: string | null;
    reference_count?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    memory_value?: string;
    context?: string | null;
    importance_score?: number | null;
    last_referenced_at?: string | null;
    reference_count?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};