export type UserAchievements = {
  Row: {
    id: string;
    user_id: string;
    achievement_id: string;
    earned_at: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    achievement_id: string;
    earned_at?: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    achievement_id?: string;
    earned_at?: string;
    created_at?: string;
  };
  Relationships: [];
};