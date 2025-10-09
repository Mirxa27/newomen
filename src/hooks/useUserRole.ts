import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfiles } from '@/integrations/supabase/tables/user_profiles';

type UserRole = UserProfiles['Row']['role'];

export function useUserRole() {
  const [role, setRole] = useState<UserRole>('user'); // Default to 'user'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setRole('user');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const userRole = (profile?.role as UserRole) || 'user'; // Explicitly cast and default to 'user'
      setRole(userRole);

    } catch (e) {
      console.error('Error fetching user role:', e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      setRole('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return { role, loading, error };
}