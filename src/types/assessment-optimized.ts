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
}

// Full assessment interface for create/update operations
export interface AssessmentFull extends AssessmentBase {
  created_by: string | null;
  duration: string | null;
  questions: SimpleJson;
  scoring_logic: SimpleJson | null;
  outcome_descriptions: SimpleJson | null;
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
  assessment_id: string;
  user_id: string;
  answers: SimpleJson;
  score: number | null;
  feedback: string | null;
  is_completed: boolean;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
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

// Supabase query builder type - simplified
export interface SupabaseQuery<T> {
  select(columns?: string): SupabaseQuery<T>;
  eq(column: string, value: unknown): SupabaseQuery<T>;
  in(column: string, values: unknown[]): SupabaseQuery<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseQuery<T>;
  limit(count: number): SupabaseQuery<T>;
  range(from: number, to: number): SupabaseQuery<T>;
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