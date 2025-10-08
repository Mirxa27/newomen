export type Sessions = {
  Row: {
    id: string;
    agent_id: string | null;
    user_id: string | null;
    realtime_session_id: string | null;
    start_ts: string | null;
    end_ts: string | null;
    status: string | null;
    duration_seconds: number | null;
    tokens_used: number | null;
    cost_usd: number | null;
    is_muted: boolean;
  };
  Insert: {
    id?: string;
    agent_id?: string | null;
    user_id?: string | null;
    realtime_session_id?: string | null;
    start_ts?: string | null;
    end_ts?: string | null;
    status?: string | null;
    duration_seconds?: number | null;
    tokens_used?: number | null;
    cost_usd?: number | null;
    is_muted?: boolean;
  };
  Update: {
    id?: string;
    agent_id?: string | null;
    user_id?: string | null;
    realtime_session_id?: string | null;
    start_ts?: string | null;
    end_ts?: string | null;
    status?: string | null;
    duration_seconds?: number | null;
    tokens_used?: number | null;
    cost_usd?: number | null;
    is_muted?: boolean;
  };
  Relationships: [];
};