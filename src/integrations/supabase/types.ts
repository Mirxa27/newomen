export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: "XX" }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assessments_enhanced: {
        Row: {
          ai_config_id: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_attempts: number | null
          passing_score: number | null
          questions: Json
          scoring_rubric: Json | null
          time_limit_minutes: number | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          ai_config_id?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          questions: Json
          scoring_rubric?: Json | null
          time_limit_minutes?: number | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          ai_config_id?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          questions?: Json
          scoring_rubric?: Json | null
          time_limit_minutes?: number | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_enhanced_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          ai_analysis: Json | null
          ai_explanation: string | null
          ai_feedback: string | null
          ai_processing_error: string | null
          ai_score: number | null
          assessment_id: string | null
          attempt_number: number
          completed_at: string | null
          created_at: string | null
          id: string
          is_ai_processed: boolean | null
          raw_responses: Json
          started_at: string | null
          status: string | null
          time_spent_minutes: number | null
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_explanation?: string | null
          ai_feedback?: string | null
          ai_processing_error?: string | null
          ai_score?: number | null
          assessment_id?: string | null
          attempt_number: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_ai_processed?: boolean | null
          raw_responses: Json
          started_at?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_explanation?: string | null
          ai_feedback?: string | null
          ai_processing_error?: string | null
          ai_score?: number | null
          assessment_id?: string | null
          attempt_number?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_ai_processed?: boolean | null
          raw_responses?: Json
          started_at?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_ai_config_for_service: {
        Args: { service_id_param?: string; service_type_param: string }
        Returns: {
          api_base_url: string
          api_version: string
          config_id: string
          config_name: string
          cost_per_1k_completion_tokens: number
          cost_per_1k_prompt_tokens: number
          custom_headers: Json
          frequency_penalty: number
          is_default: boolean
          max_tokens: number
          model_name: string
          presence_penalty: number
          provider: string
          provider_name: string
          system_prompt: string
          temperature: number
          top_p: number
          user_prompt_template: string
        }[]
      }
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
