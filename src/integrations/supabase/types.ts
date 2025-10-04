export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_url: string | null
          created_at: string | null
          crystal_reward: number | null
          description: string | null
          id: string
          title: string
          unlock_criteria: Json | null
        }
        Insert: {
          badge_url?: string | null
          created_at?: string | null
          crystal_reward?: number | null
          description?: string | null
          id?: string
          title: string
          unlock_criteria?: Json | null
        }
        Update: {
          badge_url?: string | null
          created_at?: string | null
          crystal_reward?: number | null
          description?: string | null
          id?: string
          title?: string
          unlock_criteria?: Json | null
        }
        Relationships: []
      }
      agents: {
        Row: {
          created_at: string | null
          id: string
          model_id: string | null
          name: string
          prompt_id: string | null
          status: string | null
          tool_policy: Json | null
          vad_config: Json | null
          voice_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id?: string | null
          name: string
          prompt_id?: string | null
          status?: string | null
          tool_policy?: Json | null
          vad_config?: Json | null
          voice_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string | null
          name?: string
          prompt_id?: string | null
          status?: string | null
          tool_policy?: Json | null
          vad_config?: Json | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "voices"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          answers: Json
          assessment_id: string | null
          created_at: string | null
          id: string
          score: Json | null
          user_id: string | null
        }
        Insert: {
          answers: Json
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          score?: Json | null
          user_id?: string | null
        }
        Update: {
          answers?: Json
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          score?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_type: string
          created_at: string | null
          id: string
          is_public: boolean | null
          questions: Json
          title: string
        }
        Insert: {
          assessment_type: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          questions: Json
          title: string
        }
        Update: {
          assessment_type?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          questions?: Json
          title?: string
        }
        Relationships: []
      }
      community_connections: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string | null
          requester_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id?: string | null
          requester_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string | null
          requester_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couples_challenges: {
        Row: {
          ai_analysis: string | null
          created_at: string | null
          id: string
          initiator_id: string | null
          initiator_responses: Json | null
          partner_id: string | null
          partner_responses: Json | null
          question_set: Json | null
          status: string | null
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string | null
          id?: string
          initiator_id?: string | null
          initiator_responses?: Json | null
          partner_id?: string | null
          partner_responses?: Json | null
          question_set?: Json | null
          status?: string | null
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string | null
          id?: string
          initiator_id?: string | null
          initiator_responses?: Json | null
          partner_id?: string | null
          partner_responses?: Json | null
          question_set?: Json | null
          status?: string | null
        }
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
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          emotion_data: Json | null
          id: string
          sender: string
          session_id: string | null
          text_content: string | null
          ts: string | null
        }
        Insert: {
          audio_url?: string | null
          emotion_data?: Json | null
          id?: string
          sender: string
          session_id?: string | null
          text_content?: string | null
          ts?: string | null
        }
        Update: {
          audio_url?: string | null
          emotion_data?: Json | null
          id?: string
          sender?: string
          session_id?: string | null
          text_content?: string | null
          ts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          context_limit: number | null
          created_at: string | null
          display_name: string
          enabled: boolean | null
          id: string
          is_realtime: boolean | null
          latency_hint_ms: number | null
          modality: string | null
          model_id: string
          provider_id: string | null
        }
        Insert: {
          context_limit?: number | null
          created_at?: string | null
          display_name: string
          enabled?: boolean | null
          id?: string
          is_realtime?: boolean | null
          latency_hint_ms?: number | null
          modality?: string | null
          model_id: string
          provider_id?: string | null
        }
        Update: {
          context_limit?: number | null
          created_at?: string | null
          display_name?: string
          enabled?: boolean | null
          id?: string
          is_realtime?: boolean | null
          latency_hint_ms?: number | null
          modality?: string | null
          model_id?: string
          provider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          content: Json
          created_at: string | null
          hosted_prompt_id: string | null
          id: string
          name: string
          status: string | null
          version: number | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          hosted_prompt_id?: string | null
          id?: string
          name: string
          status?: string | null
          version?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          hosted_prompt_id?: string | null
          id?: string
          name?: string
          status?: string | null
          version?: number | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          api_base: string | null
          created_at: string | null
          id: string
          last_synced_at: string | null
          name: string
          region: string | null
          status: string | null
          type: string
        }
        Insert: {
          api_base?: string | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          region?: string | null
          status?: string | null
          type: string
        }
        Update: {
          api_base?: string | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          region?: string | null
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      session_events: {
        Row: {
          event_type: string
          id: string
          payload: Json | null
          session_id: string | null
          ts: string | null
        }
        Insert: {
          event_type: string
          id?: string
          payload?: Json | null
          session_id?: string | null
          ts?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json | null
          session_id?: string | null
          ts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          agent_id: string | null
          cost_usd: number | null
          duration_seconds: number | null
          end_ts: string | null
          id: string
          realtime_session_id: string | null
          start_ts: string | null
          status: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          cost_usd?: number | null
          duration_seconds?: number | null
          end_ts?: string | null
          id?: string
          realtime_session_id?: string | null
          start_ts?: string | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          cost_usd?: number | null
          duration_seconds?: number | null
          end_ts?: string | null
          id?: string
          realtime_session_id?: string | null
          start_ts?: string | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          id: string
          provider: string | null
          provider_subscription_id: string | null
          renewal_date: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider?: string | null
          provider_subscription_id?: string | null
          renewal_date?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          provider?: string | null
          provider_subscription_id?: string | null
          renewal_date?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memory_profiles: {
        Row: {
          balance_wheel_scores: Json | null
          created_at: string | null
          emotional_state_history: Json | null
          id: string
          narrative_patterns: Json | null
          personality_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance_wheel_scores?: Json | null
          created_at?: string | null
          emotional_state_history?: Json | null
          id?: string
          narrative_patterns?: Json | null
          personality_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance_wheel_scores?: Json | null
          created_at?: string | null
          emotional_state_history?: Json | null
          id?: string
          narrative_patterns?: Json | null
          personality_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memory_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          crystal_balance: number | null
          current_level: number | null
          daily_streak: number | null
          email: string
          id: string
          last_streak_date: string | null
          nickname: string | null
          remaining_minutes: number | null
          subscription_tier: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          crystal_balance?: number | null
          current_level?: number | null
          daily_streak?: number | null
          email: string
          id?: string
          last_streak_date?: string | null
          nickname?: string | null
          remaining_minutes?: number | null
          subscription_tier?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          crystal_balance?: number | null
          current_level?: number | null
          daily_streak?: number | null
          email?: string
          id?: string
          last_streak_date?: string | null
          nickname?: string | null
          remaining_minutes?: number | null
          subscription_tier?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      voices: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          gender: string | null
          id: string
          latency_hint_ms: number | null
          locale: string | null
          name: string
          provider_id: string | null
          voice_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          gender?: string | null
          id?: string
          latency_hint_ms?: number | null
          locale?: string | null
          name: string
          provider_id?: string | null
          voice_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          gender?: string | null
          id?: string
          latency_hint_ms?: number | null
          locale?: string | null
          name?: string
          provider_id?: string | null
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_resources: {
        Row: {
          audio_url: string | null
          category: string
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          title: string
        }
        Insert: {
          audio_url?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          title: string
        }
        Update: {
          audio_url?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
