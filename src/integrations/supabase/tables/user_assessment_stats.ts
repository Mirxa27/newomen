import type { Json } from "../types";

export type UserAssessmentStats = {
  Row: {
    id: string;
    user_id: string;
    total_assessments_completed: number | null;
    total_quizzes_completed: number | null;
    total_challenges_completed: number | null;
    average_assessment_score: number | null;
    average_quiz_score: number | null;
    current_streak: number | null;
    longest_streak: number | null;
    total_ai_interactions: number | null;
    favorite_categories: Json | null;
    strengths_by_category: Json | null;
    improvement_areas: Json | null;
    last_activity_date: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    total_assessments_completed?: number | null;
    total_quizzes_completed?: number | null;
    total_challenges_completed?: number | null;
    average_assessment_score?: number | null;
    average_quiz_score?: number | null;
    current_streak?: number | null;
    longest_streak?: number | null;
    total_ai_interactions?: number | null;
    favorite_categories?: Json | null;
    strengths_by_category?: Json | null;
    improvement_areas?: Json | null;
    last_activity_date?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    total_assessments_completed?: number | null;
    total_quizzes_completed?: number | null;
    total_challenges_completed?: number | null;
    average_assessment_score?: number | null;
    average_quiz_score?: number | null;
    current_streak?: number | null;
    longest_streak?: number | null;
    total_ai_interactions?: number | null;
    favorite_categories?: Json | null;
    strengths_by_category?: Json | null;
    improvement_areas?: Json | null;
    last_activity_date?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "user_assessment_stats_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: true;
      referencedRelation: "user_profiles";
      referencedColumns: ["id"];
    }
  ];
};