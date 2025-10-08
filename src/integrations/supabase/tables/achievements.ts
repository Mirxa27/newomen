import type { Json } from "../types";

export type Achievements = {
  Row: {
    id: string;
    title: string;
    description: string | null;
    badge_url: string | null;
    unlock_criteria: Json;
    crystal_reward: number | null;
    created_at: string | null;
    category: string | null;
    is_hidden: boolean | null;
    is_active: boolean | null;
    updated_at: string;
  };
  Insert: {
    id?: string;
    title: string;
    description?: string | null;
    badge_url?: string | null;
    unlock_criteria: Json;
    crystal_reward?: number | null;
    created_at?: string | null;
    category?: string | null;
    is_hidden?: boolean | null;
    is_active?: boolean | null;
    updated_at?: string;
  };
  Update: {
    id?: string;
    title?: string;
    description?: string | null;
    badge_url?: string | null;
    unlock_criteria?: Json;
    crystal_reward?: number | null;
    created_at?: string | null;
    category?: string | null;
    is_hidden?: boolean | null;
    is_active?: boolean | null;
    updated_at?: string;
  };
  Relationships: [];
};