import type { Json } from "../types";

export type AssessmentAttempts = {
  Row: {
    id: string;
    assessment_id: string;
    user_id: string;
    attempt_number: number;
    status: string;
    raw_responses: Json;
    started_at: string;
    completed_at: string | null;
    time_spent_minutes: number | null;
    ai_analysis: Json | null;
    ai_score: number | null;
    ai_feedback: string | null;
    is_ai_processed: boolean;
    ai_processing_error: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    assessment_id: string;
    user_id: string;
    attempt_number: number;
    status?: string;
    raw_responses: Json;
    started_at?: string;
    completed_at?: string | null;
    time_spent_minutes?: number | null;
    ai_analysis?: Json | null;
    ai_score?: number | null;
    ai_feedback?: string | null;
    is_ai_processed?: boolean;
    ai_processing_error?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    assessment_id?: string;
    user_id?: string;
    attempt_number?: number;
    status?: string;
    raw_responses?: Json;
    started_at?: string;
    completed_at?: string | null;
    time_spent_minutes?: number | null;
    ai_analysis?: Json | null;
    ai_score?: number | null;
    ai_feedback?: string | null;
    is_ai_processed?: boolean;
    ai_processing_error?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};