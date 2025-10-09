export type AiModelConfigs = {
  Row: {
    id: string;
    provider_id: string | null;
    model_id: string | null;
    use_case_id: string | null;
    behavior_id: string | null;
    is_primary: boolean | null;
    priority: number | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    provider_id?: string | null;
    model_id?: string | null;
    use_case_id?: string | null;
    behavior_id?: string | null;
    is_primary?: boolean | null;
    priority?: number | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    provider_id?: string | null;
    model_id?: string | null;
    use_case_id?: string | null;
    behavior_id?: string | null;
    is_primary?: boolean | null;
    priority?: number | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};