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
          .select('trial_end_date, is_trial')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching trial data:', error);
          return;
        }

        if (roleData?.is_trial && roleData?.trial_end_date) {
          const trialEndDate = new Date(roleData.trial_end_date);
          const currentDate = new Date();
          const daysLeft = Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysLeft > 0) {
            setIsTrialUser(true);
            setTrialDaysLeft(daysLeft);
          } else {
            // Trial expired, update user to free
            setIsTrialUser(false);
            setTrialDaysLeft(0);
            
            // Update role to free if trial expired
            if (userRole === 'landlord_premium') {
              await supabase
                .from('user_roles')
                .update({ 
                  role: 'landlord_free',
                  is_trial: false 
                })
                .eq('user_id', user.id);
            }
          }
        } else {
          setIsTrialUser(false);
          setTrialDaysLeft(null);
        }
      } catch (error) {
        console.error('Error in trial countdown:', error);
      }
    };

    checkTrialStatus();
  }, [user, userRole]);

  return { trialDaysLeft, isTrialUser };
}