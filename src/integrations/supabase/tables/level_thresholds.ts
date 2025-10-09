import type { Json } from "../types";

export type LevelThresholds = {
  Row: {
    id: string;
    level: number;
    crystals_required: number;
    title: string;
    description: string | null;
    rewards: Json | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    level: number;
    crystals_required: number;
    title: string;
    description?: string | null;
    rewards?: Json | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    level?: number;
    crystals_required?: number;
    title?: string;
    description?: string | null;
    rewards?: Json | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};