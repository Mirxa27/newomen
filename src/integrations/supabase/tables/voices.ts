export type Voices = {
  Row: {
    id: string;
    provider_id: string | null;
    voice_id: string;
    name: string;
    locale: string | null;
    gender: string | null;
    latency_hint_ms: number | null;
    enabled: boolean | null;
    created_at: string | null;
  };
  Insert: { [key: string]: unknown };
  Update: { [key: string]: unknown };
  Relationships: [];
};