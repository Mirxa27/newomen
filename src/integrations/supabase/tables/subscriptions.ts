export type Subscriptions = {
  Row: {
    id: string;
    user_id: string;
    plan_id: string | null;
    status: "active" | "cancelled" | "past_due" | "trialing"; // Explicitly define enum values
    start_date: string;
    end_date: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    plan_id?: string | null;
    status?: "active" | "cancelled" | "past_due" | "trialing";
    start_date?: string;
    end_date?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    plan_id?: string | null;
    status?: "active" | "cancelled" | "past_due" | "trialing";
    start_date?: string;
    end_date?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};