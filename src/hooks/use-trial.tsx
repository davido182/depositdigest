import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useTrialCountdown() {
  const { user, userRole } = useAuth();
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isTrialUser, setIsTrialUser] = useState(false);

  useEffect(() => {
    if (!user || !userRole) return;

    const checkTrialStatus = async () => {
      try {
        // Get user role data including trial information
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching trial data:', error);
          return;
        }

        // Simplificar - no hay sistema de trial por ahora
        setIsTrialUser(false);
        setTrialDaysLeft(null);
      } catch (error) {
        console.error('Error in trial countdown:', error);
      }
    };

    checkTrialStatus();
  }, [user, userRole]);

  return { trialDaysLeft, isTrialUser };
}
