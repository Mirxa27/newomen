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
    created_at: string | null;
  };
  Insert: { [key: string]: unknown };
  Update: { [key: string]: unknown };
  Relationships: [];
};