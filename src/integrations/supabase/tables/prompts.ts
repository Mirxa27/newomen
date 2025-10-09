import type { Json } from "../types";

export type Prompts = {
  Row: {
    id: string;
    hosted_prompt_id: string | null;
    version: number | null;
    name: string;
    content: Json;
    status: "draft" | "published" | "archived"; // Explicitly define enum values
    created_at: string;
        updated_at: string;
  };
  Insert: {
    id?: string;
    hosted_prompt_id?: string | null;
    version?: number | null;
    name: string;
    content: Json;
    status?: "draft" | "published" | "archived";
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    hosted_prompt_id?: string | null;
    version?: number | null;
    name?: string;
    content?: Json;
    status?: "draft" | "published" | "archived";
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};