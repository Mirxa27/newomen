import type { Json } from "../types";

export type ChallengeTemplates = {
  Row: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    questions: Json;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    title: string;
    description?: string | null;
    category?: string;
    questions: Json;
    is_active?: boolean;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    title?: string;
    description?: string | null;
    category?: string;
    questions?: Json;
    is_active?: boolean;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};