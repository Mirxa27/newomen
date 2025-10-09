import type { Json } from "../types";

export type AssessmentResults = {
  Row: {
    id: string;
    assessment_id: string;
    user_id: string;
    attempt_id: string;
    answers: Json;
    raw_score: number;
    percentage_score: number;
    ai_feedback: string | null;
    ai_insights: Json | null;
    ai_recommendations: string | null;
    strengths_identified: Json | null;
    growth_areas: Json | null;
    overall_analysis: string | null;
    is_passed: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    assessment_id: string;
    user_id: string;
    attempt_id: string;
    answers: Json;
    raw_score: number;
    percentage_score: number;
    ai_feedback?: string | null;
    ai_insights?: Json | null;
    ai_recommendations?: string | null;
    strengths_identified?: Json | null;
    growth_areas?: Json | null;
    overall_analysis?: string | null;
    is_passed?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    assessment_id?: string;
    user_id?: string;
    attempt_id?: string;
    answers?: Json;
    raw_score?: number;
    percentage_score?: number;
    ai_feedback?: string | null;
    ai_insights?: Json | null;
    ai_recommendations?: string | null;
    strengths_identified?: Json | null;
    growth_areas?: Json | null;
    overall_analysis?: string | null;
    is_passed?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};