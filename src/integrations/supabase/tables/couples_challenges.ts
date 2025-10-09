import type { Json } from "../types";

export type CouplesChallenges = {
  Row: {
    id: string;
    initiator_id: string;
    partner_id: string | null;
    status: "pending" | "active" | "completed" | "cancelled"; // Explicitly define enum values
    question_set: Json;
    responses: Json | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  };
  Insert: {
    id?: string;
    initiator_id: string;
    partner_id?: string | null;
    status?: "pending" | "active" | "completed" | "cancelled";
    question_set: Json;
    responses?: Json | null;
    created_at?: string;
    updated_at?: string;
    completed_at?: string | null;
  };
  Update: {
    id?: string;
    initiator_id?: string;
    partner_id?: string | null;
    status?: "pending" | "active" | "completed" | "cancelled";
    question_set?: Json;
    responses?: Json | null;
    created_at?: string;
    updated_at?: string;
    completed_at?: string | null;
  };
  Relationships: [];
};