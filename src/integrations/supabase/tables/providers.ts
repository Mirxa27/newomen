export type Providers = {
  Row: {
    id: string;
    name: string;
    type: string;
    api_base: string | null;
    region: string | null;
    status: string | null;
    last_synced_at: string | null;
    created_at: string | null;
    api_key_encrypted: string | null;
    openai_compatible: boolean | null;
    max_tokens: number | null;
    temperature: number | null;
    top_p: number | null;
    frequency_penalty: number | null;
    presence_penalty: number | null;
    stop_sequences: string[] | null;
    system_instructions: string | null;
    behavior_config: import('../types').Json | null;
  };
  Insert: { [key: string]: unknown };
  Update: { [key: string]: unknown };
  Relationships: [];
};