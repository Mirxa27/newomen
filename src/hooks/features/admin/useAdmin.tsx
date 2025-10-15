import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/useAuth";

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadRole = async () => {
      if (!user) {
        if (isActive) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      
      const isAdminByEmail = user.email === 'admin@newomen.me';
      
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!isActive) return;

        if (error || !data) {
          console.error("Failed to load admin role:", error);
          setIsAdmin(isAdminByEmail);
        } else {
          const isAdminByRole = ((data as any)?.role ?? "user") === "admin";
          setIsAdmin(isAdminByRole || isAdminByEmail);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (isActive) setIsAdmin(isAdminByEmail);
      }

      if (isActive) setLoading(false);
    };

    if (!authLoading) loadRole();

    return () => {
      isActive = false;
    };
  }, [user, authLoading]);

  const fetchAllProfiles = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  return { isAdmin, loading, fetchAllProfiles };
};
