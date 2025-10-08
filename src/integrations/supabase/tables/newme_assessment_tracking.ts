import type { Json } from "../types";

export type NewmeAssessmentTracking = {
  Row: {
    id: string;
    user_id: string;
    assessment_name: string;
    suggested_in_conversation_id: string | null;
    suggested_at: string | null;
    completed_at: string | null;
    completion_status: string | null;
    key_insights: string[] | null;
    follow_up_discussed: boolean | null;
    metadata: Json | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    assessment_name: string;
    suggested_in_conversation_id?: string | null;
    suggested_at?: string | null;
    completed_at?: string | null;
    completion_status?: string | null;
    key_insights?: string[] | null;
    follow_up_discussed?: boolean | null;
    metadata?: Json | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    assessment_name?: string;
    suggested_in_conversation_id?: string | null;
    suggested_at?: string | null;
    completed_at?: string | null;
    completion_status?: string | null;
    key_insights?: string[] | null;
    follow_up_discussed?: boolean | null;
    metadata?: Json | null;
  };
  Relationships: [];
};