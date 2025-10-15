import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, UserPermissions, RolePermissions } from '@/lib/shared/types/roles';

export function useUserRole() {
  const [role, setRole] = useState<UserRole>();
  const [permissions, setPermissions] = useState<UserPermissions>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const userRole = (profile?.role as UserRole) || 'user';
        setRole(userRole);
        setPermissions(RolePermissions[userRole]);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return { role, permissions, loading };
}
