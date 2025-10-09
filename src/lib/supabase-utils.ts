import { supabase } from '@/integrations/supabase/client';
import { TablesUpdate, Database } from '@/integrations/supabase/types';

export async function updateUserProfile(
  userId: string,
  updates: Record<string, unknown>
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates as TablesUpdate<'user_profiles'>)
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error };
}

export async function updateTableRecord<T extends keyof Database['public']['Tables']>(
  tableName: T,
  id: string,
  data: any
): Promise<{ data: any; error: any }> {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data as any)
    .eq('id', id)
    .select()
    .single();
  return { data: result, error };
}