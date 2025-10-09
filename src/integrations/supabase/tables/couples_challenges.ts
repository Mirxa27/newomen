import type { Json } from "../types";

export type CouplesChallenges = {
  Row: {
    id: string;
    initiator_id: string | null;
    partner_id: string | null;
    status: string | null;
    question_set: Json;
    initiator_responses: Json | null;
    partner_responses: Json | null;
    ai_analysis: string | null;
    created_at: string | null;
    unique_link: string | null;
    responses: Json | null;
    compatibility_score: number | null;
    updated_at: string;
    expires_at: string | null;
    completed_at: string | null;
  };
  Insert: {
    id?: string;
    initiator_id?: string | null;
    partner_id?: string | null;
    status?: string | null;
    question_set: Json;
    initiator_responses?: Json | null;
    partner_responses?: Json | null;
    ai_analysis?: string | null;
    created_at?: string | null;
    unique_link?: string | null;
    responses?: Json | null;
    compatibility_score?: number | null;
    updated_at?: string;
    expires_at?: string | null;
    completed_at?: string | null;
  };
  Update: {
    id?: string;
    initiator_id?: string | null;
    partner_id?: string | null;
    status?: string | null;
    question_set?: Json;
    initiator_responses?: Json | null;
    partner_responses?: Json | null;
    ai_analysis?: string | null;
    created_at?: string | null;
    unique_link?: string | null;
    responses?: Json | null;
    compatibility_score?: number | null;
    updated_at?: string;
    expires_at?: string | null;
    completed_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "couples_challenges_initiator_id_fkey"
      columns: ["initiator_id"]
      isOneToOne: false
      referencedRelation: "user_profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "couples_challenges_partner_id_fkey"
      columns: ["partner_id"]
      isOneToOne: false
      referencedRelation: "user_profiles"
      referencedColumns: ["id"]
    }
  ]
};