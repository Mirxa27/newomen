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
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isActive) return;

      if (error) {
        console.error("Failed to load admin role", error);
        setIsAdmin(false);
      } else {
        setIsAdmin((data?.role ?? "user") === "admin");
      }

      setLoading(false);
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
