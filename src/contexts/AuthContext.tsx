
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
  hasActivePremium: boolean;
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
  refreshUserRole: (currentUser?: User) => Promise<void>;
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
  const isPremium = userRole === 'landlord_premium';
  const hasActivePremium = userRole === 'landlord_premium';

  const refreshUserRole = async (currentUser?: User) => {
    console.log("=== REFRESH USER ROLE START ===");
    
    const userToCheck = currentUser || user;
    
    if (!userToCheck) {
      console.log("No user found, setting role to null");
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log("Refreshing user role for user:", userToCheck.id, userToCheck.email);
      
      // Get user role from database with optimized query - only get the most recent role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userToCheck.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      console.log("Role query result:", { roleData, roleError });

      if (roleError) {
        if (roleError.code === 'PGRST116') {
          // No role found, create default landlord_free role
          console.log("No role found, creating default landlord_free role");
          
          const { data: newRoleData, error: createError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: userToCheck.id,
              role: 'landlord_free' as UserRole
            }])
            .select('role')
            .single();
          
          console.log("Role creation result:", { newRoleData, createError });
          
          if (createError) {
            console.error("Error creating user role:", createError);
            setUserRole('landlord_free'); // Fallback
          } else {
            console.log("Successfully created default role:", newRoleData.role);
            setUserRole(newRoleData.role);
          }
        } else {
          console.error("Error fetching user role:", roleError);
          setUserRole('landlord_free'); // Fallback
        }
      } else {
        console.log("Found existing role:", roleData.role);
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error("Exception in refreshUserRole:", error);
      setUserRole('landlord_free'); // Fallback
    } finally {
      console.log("=== REFRESH USER ROLE END ===");
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    const currentUser = user;
    if (!currentUser) return;
    
    try {
      console.log("Checking subscription for:", currentUser.email);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error("Subscription check error:", error);
        return;
      }
      
      if (data) {
        console.log("Subscription data:", data);
        setSubscriptionPlan(data.plan);
        
        // Update user role based on subscription
        if (data.plan === 'premium' && userRole === 'landlord_free') {
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role: 'landlord_premium' })
            .eq('user_id', currentUser.id);
          
          if (!updateError) {
            setUserRole('landlord_premium');
          }
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  useEffect(() => {
    let isInitialized = false;
    
    console.log("AuthProvider: Setting up Supabase auth listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("=== AUTH STATE CHANGE ===", event, session?.user?.email);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log("Password recovery event detected");
          setIsPasswordRecovery(true);
          setUser(session?.user ?? null);
          setSession(session);
          setIsLoading(false);
          return;
        }
        
        if (event === 'SIGNED_IN') {
          console.log("User signed in, setting up user state");
          setIsPasswordRecovery(false);
          setUser(session?.user ?? null);
          setSession(session);
          
          if (session?.user) {
            console.log("Calling refreshUserRole after sign in");
            await refreshUserRole(session.user);
          } else {
            setIsLoading(false);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing state");
          setIsPasswordRecovery(false);
          setUserRole(null);
          setSubscriptionPlan(null);
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    );

    // Initial session check - only run once
    const initializeAuth = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      console.log("=== INITIALIZING AUTH ===");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session:", session ? "Found" : "None");
        
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const isRecoveryUrl = urlParams.has('type') && urlParams.get('type') === 'recovery' || 
                             hashParams.has('type') && hashParams.get('type') === 'recovery' ||
                             urlParams.has('reset') && urlParams.get('reset') === 'true';
        
        if (session && isRecoveryUrl) {
          setIsPasswordRecovery(true);
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("Found session, refreshing user role");
          await refreshUserRole(session.user);
        } else {
          console.log("No session found, setting loading to false");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setIsLoading(false);
      }
    };

    // Delay initialization to avoid race conditions
    const timeoutId = setTimeout(initializeAuth, 100);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Remove this useEffect to prevent multiple role refreshes
  // The role is already refreshed in the auth state change handler

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log("SignUp attempt:", email, "with name:", fullName);
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?reset=true`,
        data: {
          full_name: fullName || email.split('@')[0],
          name: fullName || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error("SignUp error:", error);
      setIsLoading(false);
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
    // Don't set loading to false here, let the auth state change handle it
  };

  const signOut = async () => {
    console.log("SignOut initiated");
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("SignOut error:", error);
        throw error;
      }
      
      console.log("SignOut successful");
    } finally {
      setIsLoading(false);
    }
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
    hasActivePremium,
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
