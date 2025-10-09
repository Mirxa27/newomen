export type NewmeAssessmentTracking = {
  Row: {
    id: string;
    user_id: string;
    assessment_name: string;
    suggested_in_conversation_id: string | null;
    suggested_at: string;
    completion_status: "suggested" | "started" | "completed" | "dismissed"; // Explicitly define enum values
    follow_up_discussed: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    assessment_name: string;
    suggested_in_conversation_id?: string | null;
    suggested_at?: string;
    completion_status?: "suggested" | "started" | "completed" | "dismissed";
    follow_up_discussed?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    assessment_name?: string;
    suggested_in_conversation_id?: string | null;
    suggested_at?: string;
    completion_status?: "suggested" | "started" | "completed" | "dismissed";
    follow_up_discussed?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};