import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

// Export a typed supabase client for better type inference
export type TypedSupabaseClient = typeof supabase

// Helper function to get a typed table reference
export function getTable<T extends keyof Database['public']['Tables']>(tableName: T) {
  return supabase.from(tableName)
}

// Export specific table types for better type safety
export type { Database }