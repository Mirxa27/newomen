import type { Json } from "../types";

export type NewmeUserMemories = {
  Row: {
    id: string;
    user_id: string;
    memory_type: string;
    memory_key: string;
    memory_value: string;
    context: string | null;
    importance_score: number | null;
    first_mentioned_at: string | null;
    last_referenced_at: string | null;
    reference_count: number | null;
    source_conversation_id: string | null;
    is_active: boolean | null;
    metadata: Json | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    memory_type: string;
    memory_key: string;
    memory_value: string;
    context?: string | null;
    importance_score?: number | null;
    first_mentioned_at?: string | null;
    last_referenced_at?: string | null;
    reference_count?: number | null;
    source_conversation_id?: string | null;
    is_active?: boolean | null;
    metadata?: Json | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    memory_type?: string;
    memory_key?: string;
    memory_value?: string;
    context?: string | null;
    importance_score?: number | null;
    first_mentioned_at?: string | null;
    last_referenced_at?: string | null;
    reference_count?: number | null;
    source_conversation_id?: string | null;
    is_active?: boolean | null;
    metadata?: Json | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};