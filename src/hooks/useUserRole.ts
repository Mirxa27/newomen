import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

type UserRole = 'guest' | 'member' | 'admin' | 'superadmin' | 'premium';

export function useUserRole() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [role, setRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);

  const determineRole = useCallback(() => {
    setLoading(true);
    if (profileLoading) {
      return;
    }

    if (!profile) {
      setRole('guest');
      setLoading(false);
      return;
    }

    // Simple role mapping for now
    switch (profile.role) {
      case 'admin':
      case 'superadmin':
        setRole('admin');
        break;
      case 'premium':
        setRole('premium');
        break;
      default:
        setRole('member');
        break;
    }
    setLoading(false);
  }, [profile, profileLoading]);

  useEffect(() => {
    determineRole();
  }, [determineRole]);

  return { role, loading };
}