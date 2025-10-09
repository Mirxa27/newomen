import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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
      
      // First check if user email is admin email (fallback method)
      const isAdminByEmail = user.email === 'admin@newomen.me';
      
      try {
        // Try to get role from user_profiles table
        const { data, error } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!isActive) return;

        if (error) {
          console.error("Failed to load admin role from database:", error);
          // Fall back to email-based admin check
          setIsAdmin(isAdminByEmail);
        } else {
          // Check both role column and email for admin access
          const isAdminByRole = (data?.role ?? "user") === "admin";
          setIsAdmin(isAdminByRole || isAdminByEmail);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        // Fall back to email-based admin check
        if (isActive) {
          setIsAdmin(isAdminByEmail);
        }
      }

      if (isActive) {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadRole();
    }

    return () => {
      isActive = false;
    };
  }, [user, authLoading]);

  return { isAdmin, loading };
};
