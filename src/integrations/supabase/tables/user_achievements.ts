import type { Json } from "../types";

export type UserAchievements = {
  Row: {
    id: string;
    user_id: string | null;
    achievement_id: string | null;
    earned_at: string | null;
    progress_data: Json | null;
  };
  Insert: {
    id?: string;
    user_id?: string | null;
    achievement_id?: string | null;
    earned_at?: string | null;
    progress_data?: Json | null;
  };
  Update: {
    id?: string;
    user_id?: string | null;
    achievement_id?: string | null;
    earned_at?: string | null;
    progress_data?: Json | null;
  };
  Relationships: [];
};