import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfiles } from '@/integrations/supabase/tables/user_profiles';

type UserRole = UserProfiles['Row']['role']; // Access 'role' from 'Row' type

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role, email')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setError(error.message);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check both role column and email for admin access
      const isAdminByRole = (data?.role ?? "user") === "admin";
      const isAdminByEmail = (data?.email === import.meta.env.VITE_ADMIN_EMAIL);
      setIsAdmin(isAdminByRole || isAdminByEmail);

    } catch (e) {
      console.error('Unexpected error checking admin status:', e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return { isAdmin, loading, error };
}