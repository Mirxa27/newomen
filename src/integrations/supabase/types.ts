export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          crystal_balance: number | null
          current_level: number | null
          daily_streak: number | null
          email: string
          frontend_name: string | null
          id: string
          last_streak_date: string | null
          nickname: string | null
          remaining_minutes: number | null
          role: string
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          crystal_balance?: number | null
          current_level?: number | null
          daily_streak?: number | null
          email: string
          frontend_name?: string | null
          id?: string
          last_streak_date?: string | null
          nickname?: string | null
          remaining_minutes?: number | null
          role?: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          crystal_balance?: number | null
          current_level?: number | null
          daily_streak?: number | null
          email?: string
          frontend_name?: string | null
          id?: string
          last_streak_date?: string | null
          nickname?: string | null
          remaining_minutes?: number | null
          role?: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ,
      couples_challenges: {
        Row: {
          id: string
          initiator_id: string
          partner_id: string | null
          partner_name?: string | null
          status: string
          question_set: Json | null
          messages: Json[] | null
          current_question_index: number | null
          ai_analysis: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          initiator_id: string
          partner_id?: string | null
          partner_name?: string | null
          status?: string
          question_set?: Json | null
          messages?: Json[] | null
          current_question_index?: number | null
          ai_analysis?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          initiator_id?: string
          partner_id?: string | null
          partner_name?: string | null
          status?: string
          question_set?: Json | null
          messages?: Json[] | null
          current_question_index?: number | null
          ai_analysis?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conflict_patterns: {
        Row: {
          id: string
          challenge_id: string
          pattern_type: 'escalation' | 'defensiveness' | 'stonewalling' | 'criticism' | 'contempt'
          severity: number
          detected_at: string
          trigger_message: string | null
          context: string | null
          resolution_suggested: boolean
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          pattern_type: 'escalation' | 'defensiveness' | 'stonewalling' | 'criticism' | 'contempt'
          severity: number
          detected_at?: string
          trigger_message?: string | null
          context?: string | null
          resolution_suggested?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          pattern_type?: 'escalation' | 'defensiveness' | 'stonewalling' | 'criticism' | 'contempt'
          severity?: number
          detected_at?: string
          trigger_message?: string | null
          context?: string | null
          resolution_suggested?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflict_patterns_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "couples_challenges"
            referencedColumns: ["id"]
          }
        ]
      }
      conflict_resolution_exercises: {
        Row: {
          id: string
          challenge_id: string
          exercise_type: 'active_listening' | 'i_feel_statements' | 'perspective_taking' | 'de_escalation' | 'repair_attempt'
          status: 'pending' | 'in_progress' | 'completed' | 'skipped'
          exercise_data: Json
          user_response: Json | null
          partner_response: Json | null
          completed_at: string | null
          effectiveness_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          exercise_type: 'active_listening' | 'i_feel_statements' | 'perspective_taking' | 'de_escalation' | 'repair_attempt'
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped'
          exercise_data: Json
          user_response?: Json | null
          partner_response?: Json | null
          completed_at?: string | null
          effectiveness_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          exercise_type?: 'active_listening' | 'i_feel_statements' | 'perspective_taking' | 'de_escalation' | 'repair_attempt'
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped'
          exercise_data?: Json
          user_response?: Json | null
          partner_response?: Json | null
          completed_at?: string | null
          effectiveness_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflict_resolution_exercises_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "couples_challenges"
            referencedColumns: ["id"]
          }
        ]
      }
      conflict_resolution_metrics: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          metric_type: 'escalation_frequency' | 'repair_success_rate' | 'conflict_duration' | 'emotional_regulation' | 'communication_improvement'
          value: number
          measured_at: string
          context: string | null
          created_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          metric_type: 'escalation_frequency' | 'repair_success_rate' | 'conflict_duration' | 'emotional_regulation' | 'communication_improvement'
          value: number
          measured_at?: string
          context?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          metric_type?: 'escalation_frequency' | 'repair_success_rate' | 'conflict_duration' | 'emotional_regulation' | 'communication_improvement'
          value?: number
          measured_at?: string
          context?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conflict_resolution_metrics_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "couples_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_resolution_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      conflict_resolution_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          template_type: 'i_feel_statement' | 'active_listening' | 'timeout_request' | 'repair_attempt'
          template_text: string
          variables: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          template_type: 'i_feel_statement' | 'active_listening' | 'timeout_request' | 'repair_attempt'
          template_text: string
          variables?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          template_type?: 'i_feel_statement' | 'active_listening' | 'timeout_request' | 'repair_attempt'
          template_text?: string
          variables?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Additional tables would be here...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_tier: "free" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
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