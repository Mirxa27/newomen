export type GamificationSettings = {
  Row: {
    id: string;
    name: string;
    crystal_reward_session: number;
    crystal_reward_assessment: number;
    crystal_reward_challenge: number;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    name?: string;
    crystal_reward_session?: number;
    crystal_reward_assessment?: number;
    crystal_reward_challenge?: number;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    name?: string;
    crystal_reward_session?: number;
    crystal_reward_assessment?: number;
    crystal_reward_challenge?: number;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};
