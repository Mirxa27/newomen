// Optimized assessment types to prevent deep type instantiation
// Use explicit interfaces instead of generated Tables<> types

import type { Json } from "@/integrations/supabase/types";

// Simplified JSON type to prevent recursion
export type SimpleJson =
  | string
  | number
  | boolean
  | null
  | { [key: string]: SimpleJson | undefined }
  | SimpleJson[];

// Base assessment interface with essential fields only
export interface AssessmentBase {
  id: string;
  title: string;
  type: string;
  category: string | null;
  description: string | null;
  status: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  duration?: string | null; // Added duration
}

// Full assessment interface for create/update operations
export interface AssessmentFull extends AssessmentBase {
  created_by: string | null;
  questions: Json; // Use Json from Supabase types
  scoring_logic: Json | null;
  outcome_descriptions: Json | null;
}

// Type for API responses (select operations)
export type Assessment = AssessmentBase & {
  questions?: Json;
  scoring_logic?: Json | null;
  outcome_descriptions?: Json | null;
};

// Type for insert operations
export type AssessmentInsert = Omit<AssessmentFull, 'id' | 'created_at' | 'updated_at'>;

// Type for update operations
export type AssessmentUpdate = Partial<Omit<AssessmentFull, 'id' | 'created_at' | 'updated_at'>>;

// Assessment attempt types
export interface AssessmentAttempt {
  id: string;
  assessment_id: string | null;
  user_id: string | null;
  attempt_number: number;
  raw_responses: Json; // Matches Supabase schema
  ai_analysis: Json | null;
  ai_score: number | null; // Matches Supabase schema
  ai_feedback: string | null; // Matches Supabase schema
  is_ai_processed: boolean | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  time_spent_minutes: number | null;
}

// AI Configuration types
export interface AIConfiguration {
  id: string;
  name: string;
  description: string | null;
  ai_provider: string;
  ai_model: string;
  system_prompt: string | null;
  user_prompt_template: string | null;
  temperature: number | null;
  max_tokens: number | null;
  evaluation_criteria: Json | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

// Filter types - use primitives only
export interface AssessmentFilters {
  category?: string;
  difficulty?: string;
  is_public?: boolean;
  type?: string;
  status?: string;
}

// Result types
export interface AIProcessingResult {
  score: number;
  feedback: string;
  is_passing: boolean;
  details?: Record<string, unknown>;
}

// Query result types to prevent complex inference
export interface QueryResult<T> {
  data: T[] | null;
  error: {
    message: string;
    details?: unknown;
  } | null;
}

// Type assertion helpers to avoid complex inference
export function asAssessment(data: unknown): Assessment {
  return data as Assessment;
}

export function asAssessments(data: unknown): Assessment[] {
  return (data as unknown[]).map(item => asAssessment(item));
}

export function asAssessmentAttempt(data: unknown): AssessmentAttempt {
  return data as AssessmentAttempt;
}

// Utility types for partial data
export type PartialAssessment = Partial<AssessmentFull>;
export type AssessmentSummary = Pick<Assessment, 'id' | 'title' | 'category' | 'description' | 'is_public'>;