import type { Json } from "../types";

export type Prompts = {
  Row: {
    id: string;
    hosted_prompt_id: string | null;
    version: number | null;
    name: string;
    content: Json;
    status: string | null;
    created_at: string | null;
  };
  Insert: {
    id?: string;
    hosted_prompt_id?: string | null;
    version?: number | null;
    name: string;
    content: Json;
    status?: string | null;
    created_at?: string | null;
  };
  Update: {
    id?: string;
    hosted_prompt_id?: string | null;
    version?: number | null;
    name?: string;
    content?: Json;
    status?: string | null;
    created_at?: string | null;
  };
  Relationships: [];
};