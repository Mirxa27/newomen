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
          id: string
          title: string
          description: string | null
          assessment_type: string
          category: string
          difficulty_level: string | null
          estimated_duration_minutes: number | null
          max_attempts: number | null
          passing_score: number | null
          is_ai_powered: boolean | null
          ai_configuration_id: string | null
          questions: Json
          scoring_rubric: Json | null
          is_public: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assessment_type: string
          category: string
          difficulty_level?: string | null
          estimated_duration_minutes?: number | null
          max_attempts?: number | null
          passing_score?: number | null
          is_ai_powered?: boolean | null
          ai_configuration_id?: string | null
          questions: Json
          scoring_rubric?: Json | null
          is_public?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assessment_type?: string
          category?: string
          difficulty_level?: string | null
          estimated_duration_minutes?: number | null
          max_attempts?: number | null
          passing_score?: number | null
          is_ai_powered?: boolean | null
          ai_configuration_id?: string | null
          questions?: Json
          scoring_rubric?: Json | null
          is_public?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_ai_configuration_id_fkey"
            columns: ["ai_configuration_id"]
            isOneToOne: false
            referencedRelation: "ai_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
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
      community_chat_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          room_type: string
          is_active: boolean | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          room_type: string
          is_active?: boolean | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          room_type?: string
          is_active?: boolean | null
          created_at?: string | null
          created_by?: string | null
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
          message_type: string | null
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
          message_type?: string | null
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
          message_type?: string | null
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
          announcement_type: string
          priority: string | null
          target_audience: string | null
          is_active: boolean | null
          scheduled_at: string | null
          expires_at: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          announcement_type: string
          priority?: string | null
          target_audience?: string | null
          is_active?: boolean | null
          scheduled_at?: string | null
          expires_at?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          announcement_type?: string
          priority?: string | null
          target_audience?: string | null
          is_active?: boolean | null
          scheduled_at?: string | null
          expires_at?: string | null
          created_at?: string | null
          created_by?: string | null
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
          announcement_id?: string | null
          user_id?: string | null
          read_at?: string | null
        }
        Update: {
          id?: string
          announcement_id?: string | null
          user_id?: string | null
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
      session_mutes: {
        Row: {
          id: string
          session_id: string | null
          muted_by: string | null
          muted_at: string | null
          reason: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          muted_by?: string | null
          muted_at?: string | null
          reason?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          session_id?: string | null
          muted_by?: string | null
          muted_at?: string | null
          reason?: string | null
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "session_mutes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_mutes_muted_by_fkey"
            columns: ["muted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_configurations: {
        Row: {
          id: string
          name: string
          description: string | null
          provider: string
          model_name: string
          api_base_url: string | null
          api_key_encrypted: string | null
          temperature: number | null
          max_tokens: number | null
          top_p: number | null
          frequency_penalty: number | null
          presence_penalty: number | null
          system_prompt: string | null
          user_prompt_template: string | null
          scoring_prompt_template: string | null
          feedback_prompt_template: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          provider: string
          model_name: string
          api_base_url?: string | null
          api_key_encrypted?: string | null
          temperature?: number | null
          max_tokens?: number | null
          top_p?: number | null
          frequency_penalty?: number | null
          presence_penalty?: number | null
          system_prompt?: string | null
          user_prompt_template?: string | null
          scoring_prompt_template?: string | null
          feedback_prompt_template?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          provider?: string
          model_name?: string
          api_base_url?: string | null
          api_key_encrypted?: string | null
          temperature?: number | null
          max_tokens?: number | null
          top_p?: number | null
          frequency_penalty?: number | null
          presence_penalty?: number | null
          system_prompt?: string | null
          user_prompt_template?: string | null
          scoring_prompt_template?: string | null
          feedback_prompt_template?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          difficulty_level: string | null
          time_limit_minutes: number | null
          max_attempts: number | null
          passing_score: number | null
          is_ai_powered: boolean | null
          ai_configuration_id: string | null
          questions: Json
          ai_grading_prompt: string | null
          is_public: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          difficulty_level?: string | null
          time_limit_minutes?: number | null
          max_attempts?: number | null
          passing_score?: number | null
          is_ai_powered?: boolean | null
          ai_configuration_id?: string | null
          questions: Json
          ai_grading_prompt?: string | null
          is_public?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          difficulty_level?: string | null
          time_limit_minutes?: number | null
          max_attempts?: number | null
          passing_score?: number | null
          is_ai_powered?: boolean | null
          ai_configuration_id?: string | null
          questions?: Json
          ai_grading_prompt?: string | null
          is_public?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_ai_configuration_id_fkey"
            columns: ["ai_configuration_id"]
            isOneToOne: false
            referencedRelation: "ai_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          challenge_type: string
          category: string
          difficulty_level: string | null
          duration_days: number | null
          max_participants: number | null
          is_ai_powered: boolean | null
          ai_configuration_id: string | null
          instructions: string
          success_criteria: Json | null
          ai_evaluation_prompt: string | null
          reward_crystals: number | null
          is_public: boolean | null
          is_active: boolean | null
          start_date: string | null
          end_date: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          challenge_type: string
          category: string
          difficulty_level?: string | null
          duration_days?: number | null
          max_participants?: number | null
          is_ai_powered?: boolean | null
          ai_configuration_id?: string | null
          instructions: string
          success_criteria?: Json | null
          ai_evaluation_prompt?: string | null
          reward_crystals?: number | null
          is_public?: boolean | null
          is_active?: boolean | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          challenge_type?: string
          category?: string
          difficulty_level?: string | null
          duration_days?: number | null
          max_participants?: number | null
          is_ai_powered?: boolean | null
          ai_configuration_id?: string | null
          instructions?: string
          success_criteria?: Json | null
          ai_evaluation_prompt?: string | null
          reward_crystals?: number | null
          is_public?: boolean | null
          is_active?: boolean | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_ai_configuration_id_fkey"
            columns: ["ai_configuration_id"]
            isOneToOne: false
            referencedRelation: "ai_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_results: {
        Row: {
          id: string
          quiz_id: string | null
          user_id: string | null
          answers: Json
          score: number | null
          max_score: number | null
          percentage_score: number | null
          ai_feedback: string | null
          ai_explanations: Json | null
          detailed_grading: Json | null
          time_taken_seconds: number | null
          ai_model_used: string | null
          attempt_number: number | null
          is_passed: boolean | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          quiz_id?: string | null
          user_id?: string | null
          answers: Json
          score?: number | null
          max_score?: number | null
          percentage_score?: number | null
          ai_feedback?: string | null
          ai_explanations?: Json | null
          detailed_grading?: Json | null
          time_taken_seconds?: number | null
          ai_model_used?: string | null
          attempt_number?: number | null
          is_passed?: boolean | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string | null
          user_id?: string | null
          answers?: Json
          score?: number | null
          max_score?: number | null
          percentage_score?: number | null
          ai_feedback?: string | null
          ai_explanations?: Json | null
          detailed_grading?: Json | null
          time_taken_seconds?: number | null
          ai_model_used?: string | null
          attempt_number?: number | null
          is_passed?: boolean | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      challenge_progress: {
        Row: {
          id: string
          challenge_id: string | null
          user_id: string | null
          progress_data: Json | null
          ai_coaching_messages: Json | null
          current_streak: number | null
          longest_streak: number | null
          total_completions: number | null
          ai_feedback_history: Json | null
          ai_motivational_messages: Json | null
          is_completed: boolean | null
          completed_at: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          challenge_id?: string | null
          user_id?: string | null
          progress_data?: Json | null
          ai_coaching_messages?: Json | null
          current_streak?: number | null
          longest_streak?: number | null
          total_completions?: number | null
          ai_feedback_history?: Json | null
          ai_motivational_messages?: Json | null
          is_completed?: boolean | null
          completed_at?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          challenge_id?: string | null
          user_id?: string | null
          progress_data?: Json | null
          ai_coaching_messages?: Json | null
          current_streak?: number | null
          longest_streak?: number | null
          total_completions?: number | null
          ai_feedback_history?: Json | null
          ai_motivational_messages?: Json | null
          is_completed?: boolean | null
          completed_at?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_usage_logs: {
        Row: {
          id: string
          configuration_id: string | null
          user_id: string | null
          content_type: string | null
          content_id: string | null
          api_provider: string | null
          model_name: string | null
          prompt_tokens: number | null
          completion_tokens: number | null
          total_tokens: number | null
          processing_time_ms: number | null
          cost_usd: number | null
          success: boolean | null
          error_message: string | null
          request_payload: Json | null
          response_data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          configuration_id?: string | null
          user_id?: string | null
          content_type?: string | null
          content_id?: string | null
          api_provider: string | null
          model_name: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          processing_time_ms?: number | null
          cost_usd?: number | null
          success?: boolean | null
          error_message?: string | null
          request_payload?: Json | null
          response_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          configuration_id?: string | null
          user_id?: string | null
          content_type?: string | null
          content_id?: string | null
          api_provider?: string | null
          model_name?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          processing_time_ms?: number | null
          cost_usd?: number | null
          success?: boolean | null
          error_message?: string | null
          request_payload?: Json | null
          response_data?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "ai_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_assessment_stats: {
        Row: {
          id: string
          user_id: string | null
          total_assessments_completed: number | null
          total_quizzes_completed: number | null
          total_challenges_completed: number | null
          average_assessment_score: number | null
          average_quiz_score: number | null
          current_streak: number | null
          longest_streak: number | null
          total_ai_interactions: number | null
          favorite_categories: Json | null
          strengths_by_category: Json | null
          improvement_areas: Json | null
          last_activity_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          total_assessments_completed?: number | null
          total_quizzes_completed?: number | null
          total_challenges_completed?: number | null
          average_assessment_score?: number | null
          average_quiz_score?: number | null
          current_streak?: number | null
          longest_streak?: number | null
          total_ai_interactions?: number | null
          favorite_categories?: Json | null
          strengths_by_category?: Json | null
          improvement_areas?: Json | null
          last_activity_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          total_assessments_completed?: number | null
          total_quizzes_completed?: number | null
          total_challenges_completed?: number | null
          average_assessment_score?: number | null
          average_quiz_score?: number | null
          current_streak?: number | null
          longest_streak?: number | null
          total_ai_interactions?: number | null
          favorite_categories?: Json | null
          strengths_by_category?: Json | null
          improvement_areas?: Json | null
          last_activity_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_assessment_stats_user_id_fkey"
            columns: ["user_id"]
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
