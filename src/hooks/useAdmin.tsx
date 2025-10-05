import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

// Temporary admin check - will be replaced after migration approval
export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if user email is admin email
      setIsAdmin(user.email === "admin@newomen.me");
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user]);

  return { isAdmin, loading };
};
