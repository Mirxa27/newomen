import type { Json, Tables } from "@/integrations/supabase/types";

export type AIConfiguration = Tables<'ai_configurations'>;
export type Assessment = Tables<'assessments_enhanced'>;
export type AssessmentAttempt = Tables<'assessment_attempts'>;
export type AIAssessmentConfig = Tables<'ai_assessment_configs'>;

// Placeholder types for tables that may not exist in the schema anymore,
// to prevent widespread compile errors in related code.
export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  questions: Json;
  scoring_logic: Json;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  tags: string[];
  cover_image_url?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  category: string;
  difficulty_level: string;
  duration_days: number;
  tasks: Json;
  rewards: Json;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  start_date?: string;
  end_date?: string;
  cover_image_url?: string;
  participant_count: number;
}

export interface AIProcessingResult {
  score: number;
  feedback: string;
  is_passing: boolean;
  details?: Record<string, unknown>;
}