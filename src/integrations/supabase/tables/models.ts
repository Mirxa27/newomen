export type Models = {
  Row: {
    id: string;
    provider_id: string | null;
    model_id: string;
    display_name: string;
    modality: string | null;
    context_limit: number | null;
    latency_hint_ms: number | null;
    is_realtime: boolean | null;
    enabled: boolean | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    provider_id?: string | null;
    model_id: string;
    display_name: string;
    modality?: string | null;
    context_limit?: number | null;
    latency_hint_ms?: number | null;
    is_realtime?: boolean | null;
    enabled?: boolean | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    provider_id?: string | null;
    model_id?: string;
    display_name?: string;
    modality?: string | null;
    context_limit?: number | null;
    latency_hint_ms?: number | null;
    is_realtime?: boolean | null;
    enabled?: boolean | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};