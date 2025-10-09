import type { Json } from "../types";

export type UserProfiles = {
  Row: {
    id: string;
    user_id: string;
    email: string;
    nickname: string | null;
    frontend_name: string | null;
    avatar_url: string | null;
    subscription_tier: string;
    remaining_minutes: number;
    current_level: number;
    crystal_balance: number;
    daily_streak: number;
    last_streak_date: string | null;
    created_at: string;
    role: "user" | "admin" | "moderator"; // Explicitly define roles
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    email: string;
    nickname?: string | null;
    frontend_name?: string | null;
    avatar_url?: string | null;
    subscription_tier?: string;
    remaining_minutes?: number;
    current_level?: number;
    crystal_balance?: number;
    daily_streak?: number;
    last_streak_date?: string | null;
    created_at?: string;
    role?: "user" | "admin" | "moderator";
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    email?: string;
    nickname?: string | null;
    frontend_name?: string | null;
    avatar_url?: string | null;
    subscription_tier?: string;
    remaining_minutes?: number;
    current_level?: number;
    crystal_balance?: number;
    daily_streak?: number;
    last_streak_date?: string | null;
    created_at?: string;
    role?: "user" | "admin" | "moderator";
    updated_at?: string;
  };
  Relationships: [];
};