export type GamificationSettings = {
  Row: {
    id: string;
    name: string;
    crystal_reward_session: number;
    crystal_reward_assessment: number;
    crystal_reward_challenge: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    crystal_reward_session?: number;
    crystal_reward_assessment?: number;
    crystal_reward_challenge?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    crystal_reward_session?: number;
    crystal_reward_assessment?: number;
    crystal_reward_challenge?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};