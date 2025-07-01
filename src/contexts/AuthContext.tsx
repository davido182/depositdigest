
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

type UserRole = 'landlord_free' | 'landlord_premium' | 'tenant';
type AppPlan = 'free' | 'premium';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  isLandlord: boolean;
  isTenant: boolean;
  isPremium: boolean;
  subscriptionPlan: AppPlan | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkSubscription: () => Promise<void>;
  createCheckoutSession: () => Promise<string>;
  createTenantInvitation: (unitNumber: string, email?: string) => Promise<any>;
  acceptTenantInvitation: (invitationCode: string) => Promise<any>;
  refreshUserRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<AppPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Computed properties
  const isLandlord = userRole === 'landlord_free' || userRole === 'landlord_premium';
  const isTenant = userRole === 'tenant';
  const isPremium = userRole === 'landlord_premium' || subscriptionPlan === 'premium';

  const refreshUserRole = async () => {
    if (!user) return;
    
    try {
      console.log("Refreshing user role for:", user.email);
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (roleData) {
        setUserRole(roleData.role);
        console.log("User role updated:", roleData.role);
      }
    } catch (error) {
      console.error("Error refreshing user role:", error);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      console.log("Checking subscription for:", user.email);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      if (data) {
        setSubscriptionPlan(data.plan);
        console.log("Subscription checked:", data);
        await refreshUserRole();
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Setting up Supabase auth listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log("Password recovery event detected");
          setIsPasswordRecovery(true);
          setUser(session?.user ?? null);
          setSession(session);
          setIsLoading(false);
          return;
        }
        
        if (event === 'SIGNED_IN') {
          setIsPasswordRecovery(false);
          
          // Check subscription and role after sign in
          setTimeout(async () => {
            if (session?.user) {
              await checkSubscription();
              await refreshUserRole();
            }
          }, 0);
        }
        
        if (event === 'SIGNED_OUT') {
          setIsPasswordRecovery(false);
          setUserRole(null);
          setSubscriptionPlan(null);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const isRecoveryUrl = urlParams.get('type') === 'recovery' || 
                           hashParams.get('type') === 'recovery' ||
                           urlParams.get('reset') === 'true';
      
      if (session && isRecoveryUrl) {
        setIsPasswordRecovery(true);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Initial role and subscription check
      if (session?.user) {
        setTimeout(async () => {
          await checkSubscription();
          await refreshUserRole();
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log("SignUp attempt:", email);
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?reset=true`,
        data: {
          full_name: fullName || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error("SignUp error:", error);
      throw error;
    }

    console.log("SignUp successful:", data.user?.email);
    setIsLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    console.log("SignIn attempt:", email);
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("SignIn error:", error);
      setIsLoading(false);
      throw error;
    }

    console.log("SignIn successful:", data.user?.email);
  };

  const signOut = async () => {
    console.log("SignOut initiated");
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("SignOut error:", error);
      throw error;
    }
    
    console.log("SignOut successful");
  };

  const resetPassword = async (email: string) => {
    console.log("Password reset attempt for:", email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`
    });

    if (error) {
      console.error("Password reset error:", error);
      throw error;
    }

    console.log("Password reset email sent successfully");
  };

  const updatePassword = async (newPassword: string) => {
    console.log("Password update attempt");
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error("Password update error:", error);
      throw error;
    }

    console.log("Password updated successfully");
    setIsPasswordRecovery(false);
  };

  const createCheckoutSession = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('create-checkout');
    
    if (error) throw error;
    return data.url;
  };

  const createTenantInvitation = async (unitNumber: string, email?: string) => {
    const { data, error } = await supabase.functions.invoke('create-tenant-invitation', {
      body: { unit_number: unitNumber, email }
    });
    
    if (error) throw error;
    return data;
  };

  const acceptTenantInvitation = async (invitationCode: string) => {
    const { data, error } = await supabase.functions.invoke('accept-tenant-invitation', {
      body: { invitation_code: invitationCode }
    });
    
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    userRole,
    isLandlord,
    isTenant,
    isPremium,
    subscriptionPlan,
    isAuthenticated: !!user && !isPasswordRecovery,
    isLoading,
    isPasswordRecovery,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    checkSubscription,
    createCheckoutSession,
    createTenantInvitation,
    acceptTenantInvitation,
    refreshUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
