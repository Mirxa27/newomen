export type LevelThresholds = {
  Row: {
    id: string;
    level: number;
    crystals_required: number;
    title: string | null;
    description: string | null;
    rewards: import('../types').Json | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    level: number;
    crystals_required: number;
    title?: string | null;
    description?: string | null;
    rewards?: import('../types').Json | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    level?: number;
    crystals_required?: number;
    title?: string | null;
    description?: string | null;
    rewards?: import('../types').Json | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};