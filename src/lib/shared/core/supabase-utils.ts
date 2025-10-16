/**
 * Utility functions for handling Supabase type issues
 * These functions provide type-safe wrappers around Supabase operations
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Type-safe update operation for Supabase tables
 * This handles the type casting issues with Supabase client
 */
export async function safeUpdate<T>(
  tableName: string,
  id: string,
  data: Partial<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // @ts-expect-error - Bypass stale Supabase types
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    return { data: result as T | null, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Type-safe insert operation for Supabase tables
 * This handles the type casting issues with Supabase client
 */
export async function safeInsert<T>(
  tableName: string,
  data: Partial<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // @ts-expect-error - Bypass stale Supabase types
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();

    return { data: result as T | null, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Type-safe select operation for Supabase tables
 */
export async function safeSelect<T>(
  tableName: string,
  id: string
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    return { data: result as T | null, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Type-safe select with custom query for Supabase tables
 */
export async function safeSelectQuery<T>(
  tableName: string,
  query: Promise<{ data: T | null; error: Error | null }>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: result, error } = await query;

    return { data: result, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}