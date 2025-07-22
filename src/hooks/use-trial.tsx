import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useTrialCountdown() {
  const { user, userRole } = useAuth();
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isTrialUser, setIsTrialUser] = useState(false);

  useEffect(() => {
    if (!user || !userRole) return;

    // Check if user is on trial (new users get 15 days premium trial)
    const signupDate = new Date(user.created_at);
    const currentDate = new Date();
    const daysSinceSignup = Math.floor((currentDate.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (userRole === 'landlord_free' && daysSinceSignup <= 15) {
      setIsTrialUser(true);
      setTrialDaysLeft(15 - daysSinceSignup);
    } else {
      setIsTrialUser(false);
      setTrialDaysLeft(null);
    }
  }, [user, userRole]);

  return { trialDaysLeft, isTrialUser };
}