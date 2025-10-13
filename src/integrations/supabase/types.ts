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

      /* Community tables added to match apply_community_migration.sql */
      community_chat_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          room_type: 'general' | 'support' | 'announcements' | 'challenges' | 'assessments' | 'quizzes'
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          room_type?: 'general' | 'support' | 'announcements' | 'challenges' | 'assessments' | 'quizzes'
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          room_type?: 'general' | 'support' | 'announcements' | 'challenges' | 'assessments' | 'quizzes'
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_chat_messages: {
        Row: {
          id: string
          room_id: string | null
          user_id: string | null
          message: string
          message_type: 'text' | 'image' | 'file' | 'announcement' | 'challenge' | 'assessment' | 'quiz'
          metadata: Json | null
          is_edited: boolean | null
          edited_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          user_id?: string | null
          message: string
          message_type?: 'text' | 'image' | 'file' | 'announcement' | 'challenge' | 'assessment' | 'quiz'
          metadata?: Json | null
          is_edited?: boolean | null
          edited_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          user_id?: string | null
          message?: string
          message_type?: 'text' | 'image' | 'file' | 'announcement' | 'challenge' | 'assessment' | 'quiz'
          metadata?: Json | null
          is_edited?: boolean | null
          edited_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "community_chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_announcements: {
        Row: {
          id: string
          title: string
          content: string
          announcement_type: 'general' | 'challenge' | 'assessment' | 'quiz' | 'maintenance' | 'feature'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          target_audience: 'all' | 'discovery' | 'growth' | 'transformation' | 'premium'
          is_active: boolean | null
          scheduled_at: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          announcement_type: 'general' | 'challenge' | 'assessment' | 'quiz' | 'maintenance' | 'feature'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          target_audience?: 'all' | 'discovery' | 'growth' | 'transformation' | 'premium'
          is_active?: boolean | null
          scheduled_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          announcement_type?: 'general' | 'challenge' | 'assessment' | 'quiz' | 'maintenance' | 'feature'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          target_audience?: 'all' | 'discovery' | 'growth' | 'transformation' | 'premium'
          is_active?: boolean | null
          scheduled_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_announcement_reads: {
        Row: {
          id: string
          announcement_id: string | null
          user_id: string | null
          read_at: string | null
        }
        Insert: {
          id?: string
          announcement_id: string
          user_id: string
          read_at?: string | null
        }
        Update: {
          id?: string
          announcement_id?: string
          user_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "community_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_challenge_announcements: {
        Row: {
          id: string
          challenge_id: string | null
          challenge_type: 'daily' | 'weekly' | 'monthly' | 'special'
          title: string
          description: string | null
          instructions: string | null
          reward_crystals: number | null
          start_date: string | null
          end_date: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          challenge_id?: string | null
          challenge_type: 'daily' | 'weekly' | 'monthly' | 'special'
          title: string
          description?: string | null
          instructions?: string | null
          reward_crystals?: number | null
          start_date: string | null
          end_date?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          challenge_id?: string | null
          challenge_type?: 'daily' | 'weekly' | 'monthly' | 'special'
          title?: string
          description?: string | null
          instructions?: string | null
          reward_crystals?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_challenge_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_assessment_announcements: {
        Row: {
          id: string
          assessment_id: string | null
          title: string
          description: string | null
          special_instructions: string | null
          reward_crystals: number | null
          start_date: string | null
          end_date: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          assessment_id?: string | null
          title: string
          description?: string | null
          special_instructions?: string | null
          reward_crystals?: number | null
          start_date: string | null
          end_date?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          assessment_id?: string | null
          title?: string
          description?: string | null
          special_instructions?: string | null
          reward_crystals?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_assessment_announcements_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_assessment_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_quiz_announcements: {
        Row: {
          id: string
          quiz_id: string | null
          title: string
          description: string | null
          questions: Json | null
          correct_answers: Json | null
          reward_crystals: number | null
          start_date: string | null
          end_date: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          quiz_id?: string | null
          title: string
          description?: string | null
          questions?: Json | null
          correct_answers?: Json | null
          reward_crystals?: number | null
          start_date: string | null
          end_date?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string | null
          title?: string
          description?: string | null
          questions?: Json | null
          correct_answers?: Json | null
          reward_crystals?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_quiz_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      couples_challenges: {
        Row: {
          id: string
          initiator_id: string
          partner_id: string | null
          partner_name: string | null
          status: string
          question_set: Json
          messages: Json | null
          current_question_index: number
          ai_analysis: Json | null
          unique_link: string | null
          responses: Json | null
          compatibility_score: number | null
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          initiator_id: string
          partner_id?: string | null
          partner_name?: string | null
          status?: string
          question_set: Json
          messages?: Json | null
          current_question_index?: number
          ai_analysis?: Json | null
          unique_link?: string | null
          responses?: Json | null
          compatibility_score?: number | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          initiator_id?: string
          partner_id?: string | null
          partner_name?: string | null
          status?: string
          question_set?: Json
          messages?: Json | null
          current_question_index?: number
          ai_analysis?: Json | null
          unique_link?: string | null
          responses?: Json | null
          compatibility_score?: number | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
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
          }
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
