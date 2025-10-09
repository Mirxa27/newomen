import type { Json } from "../types";

export type Agents = {
  Row: {
    id: string;
    name: string;
    prompt_id: string | null;
    model_id: string | null;
    voice_id: string | null;
    vad_config: Json | null;
    tool_policy: Json | null;
    status: string | null;
    created_at: string | null;
  };
  Insert: {
    id?: string;
    name: string;
    prompt_id?: string | null;
    model_id?: string | null;
    voice_id?: string | null;
    vad_config?: Json | null;
    tool_policy?: Json | null;
    status?: string | null;
    created_at?: string | null;
  };
  Update: {
    id?: string;
    name?: string;
    prompt_id?: string | null;
    model_id?: string | null;
    voice_id?: string | null;
    vad_config?: Json | null;
    tool_policy?: Json | null;
    status?: string | null;
    created_at?: string | null;
  };
  Relationships: [];
};