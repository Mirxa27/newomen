export type AssessmentResults = {
  Row: {
    id: string;
    assessment_id: string | null;
    user_id: string | null;
    answers: import('../types').Json;
    raw_score: number | null;
    percentage_score: number | null;
    ai_feedback: string | null;
    ai_insights: import('../types').Json | null;
    ai_recommendations: string | null;
    personality_traits: import('../types').Json | null;
    strengths_identified: import('../types').Json | null;
    areas_for_improvement: import('../types').Json | null;
    detailed_explanations: import('../types').Json | null;
    processing_time_ms: number | null;
    ai_model_used: string | null;
    attempt_number: number | null;
    is_passed: boolean | null;
    completed_at: string | null;
  };
  Insert: {
    id?: string;
    assessment_id?: string | null;
    user_id?: string | null;
    answers: import('../types').Json;
    raw_score?: number | null;
    percentage_score?: number | null;
    ai_feedback?: string | null;
    ai_insights?: import('../types').Json | null;
    ai_recommendations?: string | null;
    personality_traits?: import('../types').Json | null;
    strengths_identified?: import('../types').Json | null;
    areas_for_improvement?: import('../types').Json | null;
    detailed_explanations?: import('../types').Json | null;
    processing_time_ms?: number | null;
    ai_model_used?: string | null;
    attempt_number?: number | null;
    is_passed?: boolean | null;
    completed_at?: string | null;
  };
  Update: {
    id?: string;
    assessment_id?: string | null;
    user_id?: string | null;
    answers?: import('../types').Json;
    raw_score?: number | null;
    percentage_score?: number | null;
    ai_feedback?: string | null;
    ai_insights?: import('../types').Json | null;
    ai_recommendations?: string | null;
    personality_traits?: import('../types').Json | null;
    strengths_identified?: import('../types').Json | null;
    areas_for_improvement?: import('../types').Json | null;
    detailed_explanations?: import('../types').Json | null;
    processing_time_ms?: number | null;
    ai_model_used?: string | null;
    attempt_number?: number | null;
    is_passed?: boolean | null;
    completed_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "assessment_results_assessment_id_fkey";
      columns: ["assessment_id"];
      isOneToOne: false;
      referencedRelation: "assessments";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "assessment_results_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: false;
      referencedRelation: "user_profiles";
      referencedColumns: ["id"];
    }
  ];
};
