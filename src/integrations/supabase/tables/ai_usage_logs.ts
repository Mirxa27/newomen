export type AiUsageLogs = {
  Row: {
    id: string;
    user_id: string | null;
    assessment_id: string | null;
    attempt_id: string | null;
    ai_config_id: string | null;
    provider_name: string;
    model_name: string;
    tokens_used: number | null;
    cost_usd: number | null;
    processing_time_ms: number | null;
    success: boolean;
    error_message: string | null;
    created_at: string | null;
  };
  Insert: {
    id?: string;
    user_id?: string | null;
    assessment_id?: string | null;
    attempt_id?: string | null;
    ai_config_id?: string | null;
    provider_name: string;
    model_name: string;
    tokens_used?: number | null;
    cost_usd?: number | null;
    processing_time_ms?: number | null;
    success: boolean;
    error_message?: string | null;
    created_at?: string | null;
  };
  Update: {
    id?: string;
    user_id?: string | null;
    assessment_id?: string | null;
    attempt_id?: string | null;
    ai_config_id?: string | null;
    provider_name?: string;
    model_name?: string;
    tokens_used?: number | null;
    cost_usd?: number | null;
    processing_time_ms?: number | null;
    success?: boolean;
    error_message?: string | null;
    created_at?: string | null;
  };
  Relationships: [];
};