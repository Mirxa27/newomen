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
    status: "active" | "inactive"; // Explicitly define enum values
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    prompt_id?: string | null;
    model_id?: string | null;
    voice_id?: string | null;
    vad_config?: Json | null;
    tool_policy?: Json | null;
    status?: "active" | "inactive";
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    prompt_id?: string | null;
    model_id?: string | null;
    voice_id?: string | null;
    vad_config?: Json | null;
    tool_policy?: Json | null;
    status?: "active" | "inactive";
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};