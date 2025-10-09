import type { Json } from "../types";

export type PromptTemplates = {
  Row: {
    id: string;
    use_case_id: string | null;
    provider_id: string | null;
    name: string;
    system_prompt: string;
    user_prompt_template: string | null;
    variables: Json | null;
    temperature: number | null;
    max_tokens: number | null;
    is_default: boolean | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    use_case_id?: string | null;
    provider_id?: string | null;
    name: string;
    system_prompt: string;
    user_prompt_template?: string | null;
    variables?: Json | null;
    temperature?: number | null;
    max_tokens?: number | null;
    is_default?: boolean | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    use_case_id?: string | null;
    provider_id?: string | null;
    name?: string;
    system_prompt?: string;
    user_prompt_template?: string | null;
    variables?: Json | null;
    temperature?: number | null;
    max_tokens?: number | null;
    is_default?: boolean | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
};