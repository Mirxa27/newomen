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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_url: string | null
          category: string | null
          created_at: string | null
          crystal_reward: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_hidden: boolean | null
          title: string
          unlock_criteria: Json
          updated_at: string
        }
        Insert: {
          badge_url?: string | null
          category?: string | null
          created_at?: string | null
          crystal_reward?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          title: string
          unlock_criteria: Json
          updated_at?: string
        }
        Update: {
          badge_url?: string | null
          category?: string | null
          created_at?: string | null
          crystal_reward?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          title?: string
          unlock_criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      affirmations: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          tags: string[] | null
          tone: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          tags?: string[] | null
          tone?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          tags?: string[] | null
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affirmations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      ai_assessment_configs: {
        Row: {
          ai_model: string
          ai_provider: string
          created_at: string
          description: string | null
          evaluation_criteria: Json | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          name: string
          system_prompt: string | null
          temperature: number | null
          updated_at: string
          user_prompt_template: string | null
        }
        Insert: {
          ai_model: string
          ai_provider: string
          created_at?: string
          description?: string | null
          evaluation_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          name: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
          user_prompt_template?: string | null
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          created_at?: string
          description?: string | null
          evaluation_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          name?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
          user_prompt_template?: string | null
        }
        Relationships: []
      }
      ai_behaviors: {
        Row: {
          communication_style: string | null
          created_at: string | null
          description: string | null
          emotional_tone: string | null
          id: string
          is_active: boolean | null
          name: string
          personality_traits: Json | null
          response_length: string | null
          updated_at: string | null
        }
        Insert: {
          communication_style?: string | null
          created_at?: string | null
          description?: string | null
          emotional_tone?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          personality_traits?: Json | null
          response_length?: string | null
          updated_at?: string | null
        }
        Update: {
          communication_style?: string | null
          created_at?: string | null
          description?: string | null
          emotional_tone?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          personality_traits?: Json | null
          response_length?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_configurations: {
        Row: {
          api_base_url: string | null
          api_key_encrypted: string | null
          api_version: string | null
          cost_per_1k_completion_tokens: number | null
          cost_per_1k_prompt_tokens: number | null
          created_at: string | null
          created_by: string | null
          custom_headers: Json | null
          description: string | null
          frequency_penalty: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_tested_at: string | null
          max_requests_per_minute: number | null
          max_tokens: number | null
          max_tokens_per_minute: number | null
          metadata: Json | null
          model_name: string
          name: string
          presence_penalty: number | null
          provider: string
          provider_name: string | null
          stop_sequences: string[] | null
          system_prompt: string | null
          tags: string[] | null
          temperature: number | null
          test_status: string | null
          top_p: number | null
          updated_at: string | null
          user_prompt_template: string | null
        }
        Insert: {
          api_base_url?: string | null
          api_key_encrypted?: string | null
          api_version?: string | null
          cost_per_1k_completion_tokens?: number | null
          cost_per_1k_prompt_tokens?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_headers?: Json | null
          description?: string | null
          frequency_penalty?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_tested_at?: string | null
          max_requests_per_minute?: number | null
          max_tokens?: number | null
          max_tokens_per_minute?: number | null
          metadata?: Json | null
          model_name: string
          name: string
          presence_penalty?: number | null
          provider: string
          provider_name?: string | null
          stop_sequences?: string[] | null
          system_prompt?: string | null
          tags?: string[] | null
          temperature?: number | null
          test_status?: string | null
          top_p?: number | null
          updated_at?: string | null
          user_prompt_template?: string | null
        }
        Update: {
          api_base_url?: string | null
          api_key_encrypted?: string | null
          api_version?: string | null
          cost_per_1k_completion_tokens?: number | null
          cost_per_1k_prompt_tokens?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_headers?: Json | null
          description?: string | null
          frequency_penalty?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_tested_at?: string | null
          max_requests_per_minute?: number | null
          max_tokens?: number | null
          max_tokens_per_minute?: number | null
          metadata?: Json | null
          model_name?: string
          name?: string
          presence_penalty?: number | null
          provider?: string
          provider_name?: string | null
          stop_sequences?: string[] | null
          system_prompt?: string | null
          tags?: string[] | null
          temperature?: number | null
          test_status?: string | null
          top_p?: number | null
          updated_at?: string | null
          user_prompt_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_configs: {
        Row: {
          behavior_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          model_id: string | null
          priority: number | null
          provider_id: string | null
          updated_at: string | null
          use_case_id: string | null
        }
        Insert: {
          behavior_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          model_id?: string | null
          priority?: number | null
          provider_id?: string | null
          updated_at?: string | null
          use_case_id?: string | null
        }
        Update: {
          behavior_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          model_id?: string | null
          priority?: number | null
          provider_id?: string | null
          updated_at?: string | null
          use_case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_configs_behavior_id_fkey"
            columns: ["behavior_id"]
            isOneToOne: false
            referencedRelation: "ai_behaviors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_model_configs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_model_configs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_model_configs_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "ai_use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_processing_queue: {
        Row: {
          attempt_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          priority: number | null
          processing_completed_at: string | null
          processing_started_at: string | null
          processing_type: string
          retry_count: number | null
          status: string | null
        }
        Insert: {
          attempt_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_type: string
          retry_count?: number | null
          status?: string | null
        }
        Update: {
          attempt_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_type?: string
          retry_count?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_queue_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          max_requests: number | null
          provider_name: string
          requests_count: number | null
          updated_at: string | null
          user_id: string | null
          window_duration_minutes: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_requests?: number | null
          provider_name: string
          requests_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_duration_minutes?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_requests?: number | null
          provider_name?: string
          requests_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_duration_minutes?: number | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_service_configs: {
        Row: {
          ai_configuration_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_fallback: boolean | null
          max_tokens_override: number | null
          priority: number | null
          service_id: string | null
          service_name: string | null
          service_type: string
          system_prompt_override: string | null
          temperature_override: number | null
          updated_at: string | null
          user_prompt_template_override: string | null
        }
        Insert: {
          ai_configuration_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_fallback?: boolean | null
          max_tokens_override?: number | null
          priority?: number | null
          service_id?: string | null
          service_name?: string | null
          service_type: string
          system_prompt_override?: string | null
          temperature_override?: number | null
          updated_at?: string | null
          user_prompt_template_override?: string | null
        }
        Update: {
          ai_configuration_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_fallback?: boolean | null
          max_tokens_override?: number | null
          priority?: number | null
          service_id?: string | null
          service_name?: string | null
          service_type?: string
          system_prompt_override?: string | null
          temperature_override?: number | null
          updated_at?: string | null
          user_prompt_template_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_service_configs_ai_configuration_id_fkey"
            columns: ["ai_configuration_id"]
            isOneToOne: false
            referencedRelation: "ai_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          ai_config_id: string | null
          assessment_id: string | null
          attempt_id: string | null
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          id: string
          model_name: string
          processing_time_ms: number | null
          provider_name: string
          success: boolean
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          ai_config_id?: string | null
          assessment_id?: string | null
          attempt_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          model_name: string
          processing_time_ms?: number | null
          provider_name: string
          success: boolean
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          ai_config_id?: string | null
          assessment_id?: string | null
          attempt_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          model_name?: string
          processing_time_ms?: number | null
          provider_name?: string
          success?: boolean
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_use_cases: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_configurations: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_tested: string | null
          mode: string | null
          service: string
          test_status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          mode?: string | null
          service: string
          test_status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          mode?: string | null
          service?: string
          test_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_integrations: {
        Row: {
          client_id: string | null
          client_secret: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_tested: string | null
          mode: string | null
          service: string
          test_status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          mode?: string | null
          service: string
          test_status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          mode?: string | null
          service?: string
          test_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      assessment_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          answers: Json
          assessment_id: string | null
          completed_at: string
          created_at: string | null
          id: string
          outcome: string | null
          score: Json | null
          user_id: string | null
        }
        Insert: {
          answers: Json
          assessment_id?: string | null
          completed_at?: string
          created_at?: string | null
          id?: string
          outcome?: string | null
          score?: Json | null
          user_id?: string | null
        }
        Update: {
          answers?: Json
          assessment_id?: string | null
          completed_at?: string
          created_at?: string | null
          id?: string
          outcome?: string | null
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
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: string | null
          id: string
          is_public: boolean | null
          outcome_descriptions: Json | null
          questions: Json
          scoring_logic: Json | null
          status: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_public?: boolean | null
          outcome_descriptions?: Json | null
          questions: Json
          scoring_logic?: Json | null
          status?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_public?: boolean | null
          outcome_descriptions?: Json | null
          questions?: Json
          scoring_logic?: Json | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      challenge_participants: {
        Row: {
          challenge_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          joined_at: string | null
          partner_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          joined_at?: string | null
          partner_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          joined_at?: string | null
          partner_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "assessments_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          questions: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_types: {
        Row: {
          ai_config_id: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_data: Json | null
        }
        Insert: {
          ai_config_id?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_data?: Json | null
        }
        Update: {
          ai_config_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_data?: Json | null
        }
        Relationships: []
      }
      community_announcement_reads: {
        Row: {
          announcement_id: string | null
          id: string
          read_at: string
          user_id: string | null
        }
        Insert: {
          announcement_id?: string | null
          id?: string
          read_at?: string
          user_id?: string | null
        }
        Update: {
          announcement_id?: string | null
          id?: string
          read_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "community_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      community_announcements: {
        Row: {
          announcement_type: string
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          priority: string | null
          scheduled_at: string | null
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          announcement_type: string
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          scheduled_at?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          announcement_type?: string
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          scheduled_at?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_assessment_announcements: {
        Row: {
          assessment_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          reward_crystals: number | null
          special_instructions: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reward_crystals?: number | null
          special_instructions?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reward_crystals?: number | null
          special_instructions?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_assessment_announcements_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_challenge_announcements: {
        Row: {
          challenge_id: string | null
          challenge_type: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          reward_crystals: number | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          challenge_id?: string | null
          challenge_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          reward_crystals?: number | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          challenge_id?: string | null
          challenge_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          reward_crystals?: number | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_chat_messages: {
        Row: {
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "community_chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      community_chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          room_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          room_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          room_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_connections: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          receiver_id: string | null
          requester_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          receiver_id?: string | null
          requester_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          receiver_id?: string | null
          requester_id?: string | null
          status?: string | null
          updated_at?: string
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
      community_quiz_announcements: {
        Row: {
          correct_answers: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          questions: Json | null
          quiz_id: string | null
          reward_crystals: number | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          correct_answers?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json | null
          quiz_id?: string | null
          reward_crystals?: number | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          correct_answers?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json | null
          quiz_id?: string | null
          reward_crystals?: number | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          session_id: string | null
          started_at: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          session_id?: string | null
          started_at?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          session_id?: string | null
          started_at?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      couples_challenge_responses: {
        Row: {
          challenge_id: string | null
          id: string
          question_index: number
          response: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          id?: string
          question_index: number
          response: string
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          id?: string
          question_index?: number
          response?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couples_challenge_responses_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "couples_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      couples_challenges: {
        Row: {
          ai_analysis: string | null
          compatibility_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          initiator_id: string | null
          initiator_responses: Json | null
          partner_id: string | null
          partner_responses: Json | null
          question_set: Json
          responses: Json | null
          status: string | null
          unique_link: string | null
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          compatibility_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          initiator_id?: string | null
          initiator_responses?: Json | null
          partner_id?: string | null
          partner_responses?: Json | null
          question_set: Json
          responses?: Json | null
          status?: string | null
          unique_link?: string | null
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          compatibility_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          initiator_id?: string | null
          initiator_responses?: Json | null
          partner_id?: string | null
          partner_responses?: Json | null
          question_set?: Json
          responses?: Json | null
          status?: string | null
          unique_link?: string | null
          updated_at?: string
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
      crystal_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          source: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          source: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          source?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      level_thresholds: {
        Row: {
          created_at: string
          crystals_required: number
          description: string | null
          id: string
          level: number
          rewards: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crystals_required: number
          description?: string | null
          id?: string
          level: number
          rewards?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crystals_required?: number
          description?: string | null
          id?: string
          level?: number
          rewards?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_url: string | null
          conversation_id: string | null
          emotion_data: Json | null
          id: string
          sender: string
          session_id: string | null
          text_content: string | null
          ts: string | null
        }
        Insert: {
          audio_url?: string | null
          conversation_id?: string | null
          emotion_data?: Json | null
          id?: string
          sender: string
          session_id?: string | null
          text_content?: string | null
          ts?: string | null
        }
        Update: {
          audio_url?: string | null
          conversation_id?: string | null
          emotion_data?: Json | null
          id?: string
          sender?: string
          session_id?: string | null
          text_content?: string | null
          ts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
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
      newme_assessment_tracking: {
        Row: {
          assessment_name: string
          completed_at: string | null
          completion_status: string | null
          follow_up_discussed: boolean | null
          id: string
          key_insights: string[] | null
          metadata: Json | null
          suggested_at: string | null
          suggested_in_conversation_id: string | null
          user_id: string
        }
        Insert: {
          assessment_name: string
          completed_at?: string | null
          completion_status?: string | null
          follow_up_discussed?: boolean | null
          id?: string
          key_insights?: string[] | null
          metadata?: Json | null
          suggested_at?: string | null
          suggested_in_conversation_id?: string | null
          user_id: string
        }
        Update: {
          assessment_name?: string
          completed_at?: string | null
          completion_status?: string | null
          follow_up_discussed?: boolean | null
          id?: string
          key_insights?: string[] | null
          metadata?: Json | null
          suggested_at?: string | null
          suggested_in_conversation_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newme_assessment_tracking_suggested_in_conversation_id_fkey"
            columns: ["suggested_in_conversation_id"]
            isOneToOne: false
            referencedRelation: "newme_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newme_assessment_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newme_conversations: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          emotional_tone: string | null
          ended_at: string | null
          id: string
          key_insights: string[] | null
          message_count: number | null
          metadata: Json | null
          started_at: string | null
          suggested_assessments: string[] | null
          summary: string | null
          topics_discussed: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          emotional_tone?: string | null
          ended_at?: string | null
          id?: string
          key_insights?: string[] | null
          message_count?: number | null
          metadata?: Json | null
          started_at?: string | null
          suggested_assessments?: string[] | null
          summary?: string | null
          topics_discussed?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          emotional_tone?: string | null
          ended_at?: string | null
          id?: string
          key_insights?: string[] | null
          message_count?: number | null
          metadata?: Json | null
          started_at?: string | null
          suggested_assessments?: string[] | null
          summary?: string | null
          topics_discussed?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newme_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newme_emotional_snapshots: {
        Row: {
          conversation_id: string | null
          coping_strategies: string[] | null
          emotion_intensity: number | null
          id: string
          metadata: Json | null
          notes: string | null
          primary_emotion: string
          snapshot_date: string | null
          triggers: string[] | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          coping_strategies?: string[] | null
          emotion_intensity?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          primary_emotion: string
          snapshot_date?: string | null
          triggers?: string[] | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          coping_strategies?: string[] | null
          emotion_intensity?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          primary_emotion?: string
          snapshot_date?: string | null
          triggers?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newme_emotional_snapshots_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "newme_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newme_emotional_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newme_messages: {
        Row: {
          audio_duration_ms: number | null
          content: string
          conversation_id: string
          emotion_detected: string | null
          id: string
          metadata: Json | null
          role: string
          sentiment_score: number | null
          timestamp: string | null
        }
        Insert: {
          audio_duration_ms?: number | null
          content: string
          conversation_id: string
          emotion_detected?: string | null
          id?: string
          metadata?: Json | null
          role: string
          sentiment_score?: number | null
          timestamp?: string | null
        }
        Update: {
          audio_duration_ms?: number | null
          content?: string
          conversation_id?: string
          emotion_detected?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          sentiment_score?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newme_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "newme_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      newme_user_memories: {
        Row: {
          context: string | null
          created_at: string | null
          first_mentioned_at: string | null
          id: string
          importance_score: number | null
          is_active: boolean | null
          last_referenced_at: string | null
          memory_key: string
          memory_type: string
          memory_value: string
          metadata: Json | null
          reference_count: number | null
          source_conversation_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          first_mentioned_at?: string | null
          id?: string
          importance_score?: number | null
          is_active?: boolean | null
          last_referenced_at?: string | null
          memory_key: string
          memory_type: string
          memory_value: string
          metadata?: Json | null
          reference_count?: number | null
          source_conversation_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          first_mentioned_at?: string | null
          id?: string
          importance_score?: number | null
          is_active?: boolean | null
          last_referenced_at?: string | null
          memory_key?: string
          memory_type?: string
          memory_value?: string
          metadata?: Json | null
          reference_count?: number | null
          source_conversation_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newme_user_memories_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "newme_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newme_user_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_tokens: number | null
          name: string
          provider_id: string | null
          system_prompt: string
          temperature: number | null
          updated_at: string | null
          use_case_id: string | null
          user_prompt_template: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          name: string
          provider_id?: string | null
          system_prompt: string
          temperature?: number | null
          updated_at?: string | null
          use_case_id?: string | null
          user_prompt_template?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          name?: string
          provider_id?: string | null
          system_prompt?: string
          temperature?: number | null
          updated_at?: string | null
          use_case_id?: string | null
          user_prompt_template?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_templates_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "ai_use_cases"
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
      provider_credentials: {
        Row: {
          created_at: string
          encrypted_api_key: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_api_key: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_api_key?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_credentials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          api_base: string | null
          api_key_encrypted: string | null
          behavior_config: Json | null
          created_at: string | null
          frequency_penalty: number | null
          id: string
          last_synced_at: string | null
          max_tokens: number | null
          name: string
          openai_compatible: boolean | null
          presence_penalty: number | null
          region: string | null
          status: string | null
          stop_sequences: string[] | null
          system_instructions: string | null
          temperature: number | null
          top_p: number | null
          type: string
        }
        Insert: {
          api_base?: string | null
          api_key_encrypted?: string | null
          behavior_config?: Json | null
          created_at?: string | null
          frequency_penalty?: number | null
          id?: string
          last_synced_at?: string | null
          max_tokens?: number | null
          name: string
          openai_compatible?: boolean | null
          presence_penalty?: number | null
          region?: string | null
          status?: string | null
          stop_sequences?: string[] | null
          system_instructions?: string | null
          temperature?: number | null
          top_p?: number | null
          type: string
        }
        Update: {
          api_base?: string | null
          api_key_encrypted?: string | null
          behavior_config?: Json | null
          created_at?: string | null
          frequency_penalty?: number | null
          id?: string
          last_synced_at?: string | null
          max_tokens?: number | null
          name?: string
          openai_compatible?: boolean | null
          presence_penalty?: number | null
          region?: string | null
          status?: string | null
          stop_sequences?: string[] | null
          system_instructions?: string | null
          temperature?: number | null
          top_p?: number | null
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
      session_mutes: {
        Row: {
          id: string
          is_active: boolean | null
          muted_at: string | null
          muted_by: string | null
          reason: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          muted_at?: string | null
          muted_by?: string | null
          reason?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          muted_at?: string | null
          muted_by?: string | null
          reason?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_mutes_muted_by_fkey"
            columns: ["muted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_mutes_session_id_fkey"
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
          is_muted: boolean
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
          is_muted?: boolean
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
          is_muted?: boolean
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
      subscription_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          provider_response: Json | null
          provider_transaction_id: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          provider_response?: Json | null
          provider_transaction_id?: string | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          provider_response?: Json | null
          provider_transaction_id?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          minutes_included: number
          minutes_used: number | null
          price: number | null
          provider: string | null
          provider_id: string | null
          renewal_date: string | null
          status: string | null
          tier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          minutes_included?: number
          minutes_used?: number | null
          price?: number | null
          provider?: string | null
          provider_id?: string | null
          renewal_date?: string | null
          status?: string | null
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          minutes_included?: number
          minutes_used?: number | null
          price?: number | null
          provider?: string | null
          provider_id?: string | null
          renewal_date?: string | null
          status?: string | null
          tier?: string
          updated_at?: string
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
          progress_data: Json | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          progress_data?: Json | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          progress_data?: Json | null
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
      user_assessment_progress: {
        Row: {
          assessment_id: string | null
          best_attempt_id: string | null
          best_score: number | null
          completion_date: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          last_attempt_at: string | null
          total_attempts: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          best_attempt_id?: string | null
          best_score?: number | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_attempt_at?: string | null
          total_attempts?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          best_attempt_id?: string | null
          best_score?: number | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_attempt_at?: string | null
          total_attempts?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_assessment_progress_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assessment_progress_best_attempt_id_fkey"
            columns: ["best_attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assessment_progress_user_id_fkey"
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
          narrative_identity_data: Json | null
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
          narrative_identity_data?: Json | null
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
          narrative_identity_data?: Json | null
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
          role: string
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
          role?: string
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
          role?: string
          subscription_tier?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_resource_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_accessed_at: string
          progress_percentage: number | null
          resource_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_accessed_at?: string
          progress_percentage?: number | null
          resource_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_accessed_at?: string
          progress_percentage?: number | null
          resource_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_resource_progress_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "wellness_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
          created_by: string | null
          description: string | null
          download_url: string | null
          duration: number | null
          id: string
          is_downloadable: boolean | null
          is_premium: boolean | null
          required_tier: string | null
          status: string | null
          tags: string[] | null
          title: string
          transcript: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          audio_url?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_url?: string | null
          duration?: number | null
          id?: string
          is_downloadable?: boolean | null
          is_premium?: boolean | null
          required_tier?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          transcript?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          audio_url?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_url?: string | null
          duration?: number | null
          id?: string
          is_downloadable?: boolean | null
          is_premium?: boolean | null
          required_tier?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          transcript?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _create_admin_policy_if_table_exists: {
        Args: { for_ops: string; polname: string; tbl: unknown }
        Returns: undefined
      }
      ai_content_builder: {
        Args: {
          p_content_type: string
          p_length?: string
          p_style?: string
          p_topic: string
        }
        Returns: Json
      }
      award_crystals: {
        Args: {
          p_amount: number
          p_description?: string
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_source: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_achievements: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_ai_rate_limit: {
        Args: {
          p_max_requests?: number
          p_provider_name: string
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      generate_challenge_link: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_ai_config_for_service: {
        Args: { p_service_id?: string; p_service_type: string }
        Returns: {
          api_base_url: string
          api_version: string
          config_id: string
          config_name: string
          cost_per_1k_input_tokens: number
          cost_per_1k_output_tokens: number
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
      get_newme_user_context: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_unread_announcements_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_rate_limit: {
        Args: {
          p_max_requests?: number
          p_provider_name: string
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_announcement_read: {
        Args: { p_announcement_id: string }
        Returns: undefined
      }
      paypal_capture_order: {
        Args: { p_order_id: string }
        Returns: Json
      }
      paypal_create_order: {
        Args: { p_amount: number; p_currency?: string; p_description?: string }
        Returns: Json
      }
      promote_user_to_admin: {
        Args: { p_email: string }
        Returns: undefined
      }
      provider_discovery: {
        Args: { p_service_type?: string }
        Returns: Json
      }
      realtime_token: {
        Args: { p_user_id: string }
        Returns: Json
      }
      update_subscription_minutes: {
        Args: { p_minutes_used: number; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
