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
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string
          features: Json | null
          id: string
          is_active: boolean | null
          minutes_included: number
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          minutes_included: number
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          minutes_included?: number
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
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
      error_reports: {
        Row: {
          action: string | null
          component: string | null
          context: Json | null
          created_at: string | null
          error_category: string | null
          error_message: string
          error_stack: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          component?: string | null
          context?: Json | null
          created_at?: string | null
          error_category?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          component?: string | null
          context?: Json | null
          created_at?: string | null
          error_category?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      purchase_subscription: {
        Args: {
          p_payment_id: string
          p_payment_method?: string
          p_plan_id: string
          p_user_id: string
        }
        Returns: Json
      }
      consume_talk_minutes: {
        Args: { p_minutes_used: number; p_user_id: string }
        Returns: Json
      }
      get_user_subscription_info: {
        Args: { p_user_id: string }
        Returns: Json
      }
    }
  }
}