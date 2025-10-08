export type UserAssessmentProgress = {
  Row: {
    id: string;
    user_id: string | null;
    assessment_id: string | null;
    best_score: number | null;
    best_attempt_id: string | null;
    total_attempts: number | null;
    last_attempt_at: string | null;
    is_completed: boolean | null;
    completion_date: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: { [key: string]: unknown };
  Update: { [key: string]: unknown };
  Relationships: [];
};