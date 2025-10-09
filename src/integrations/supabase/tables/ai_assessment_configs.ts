import type { Json } from "../types";

export type AiAssessmentConfigs = {
  Row: {
    id: string;
    name: string;
    description: string | null;
    ai_provider: string;
    ai_model: string;
    temperature: number | null;
    max_tokens: number | null;
    system_prompt: string | null;
    user_prompt_template: string | null;
    evaluation_criteria: Json | null;
    is_active: boolean | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    description?: string | null;
    ai_provider: string;
    ai_model: string;
    temperature?: number | null;
    max_tokens?: number | null;
    system_prompt?: string | null;
    user_prompt_template?: string | null;
    evaluation_criteria?: Json | null;
    is_active?: boolean | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    description?: string | null;
    ai_provider?: string;
    ai_model?: string;
    temperature?: number | null;
    max_tokens?: number | null;
    system_prompt?: string | null;
    user_prompt_template?: string | null;
    evaluation_criteria?: Json | null;
    is_active?: boolean | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};