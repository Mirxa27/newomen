export type UserAssessmentProgress = {
  Row: {
    id: string;
    user_id: string;
    assessment_id: string;
    best_score: number | null;
    best_attempt_id: string | null;
    total_attempts: number;
    last_attempt_at: string | null;
    is_completed: boolean;
    completion_date: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    assessment_id: string;
    best_score?: number | null;
    best_attempt_id?: string | null;
    total_attempts?: number;
    last_attempt_at?: string | null;
    is_completed?: boolean;
    completion_date?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    assessment_id?: string;
    best_score?: number | null;
    best_attempt_id?: string | null;
    total_attempts?: number;
    last_attempt_at?: string | null;
    is_completed?: boolean;
    completion_date?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};