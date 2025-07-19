
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
  const [isInitialized, setIsInitialized] = useState(false);

  console.log("🔐 AuthProvider render:", { 
    hasUser: !!user, 
    userRole, 
    isLoading, 
    isInitialized,
    timestamp: new Date().toISOString()
  });

  // Computed properties
  const isLandlord = userRole === 'landlord_free' || userRole === 'landlord_premium';
  const isTenant = userRole === 'tenant';
  const isPremium = userRole === 'landlord_premium';
  const hasActivePremium = userRole === 'landlord_premium';

  const refreshUserRole = async (currentUser?: User) => {
    const userToCheck = currentUser || user;
    
    console.log("🔄 refreshUserRole called:", { 
      hasUser: !!userToCheck, 
      userId: userToCheck?.id,
      timestamp: new Date().toISOString()
    });
    
    if (!userToCheck) {
      console.log("❌ No user to check, setting role to null");
      setUserRole(null);
      return;
    }

    try {
      console.log("📡 Fetching user role from database...");
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userToCheck.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error("❌ Error fetching user role:", roleError);
        console.log("🔧 Setting default role: landlord_free");
        setUserRole('landlord_free');
        return;
      }

      if (!roleData) {
        console.log("📝 No role found, creating default role...");
        const { data: newRoleData, error: createError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userToCheck.id,
            role: 'landlord_free' as UserRole
          }])
          .select('role')
          .single();
          
        if (createError) {
          console.error("❌ Error creating user role:", createError);
          console.log("🔧 Fallback: setting role to landlord_free");
          setUserRole('landlord_free');
        } else {
          console.log("✅ Created new role:", newRoleData.role);
          setUserRole(newRoleData.role);
        }
      } else {
        console.log("✅ Found existing role:", roleData.role);
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error("💥 Exception in refreshUserRole:", error);
      console.log("🔧 Fallback: setting role to landlord_free");
      setUserRole('landlord_free');
    }
  };

  const checkSubscription = async () => {
    const currentUser = user;
    if (!currentUser) return;
    
    try {
      console.log("💳 Checking subscription for:", currentUser.email);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error("❌ Subscription check error:", error);
        return;
      }
      
      if (data) {
        console.log("✅ Subscription data:", data);
        setSubscriptionPlan(data.plan);
        
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
      console.error("💥 Error checking subscription:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;

    console.log("🚀 Starting auth initialization...");

    const initializeAuth = async () => {
      try {
        // Set timeout as fallback
        initializationTimeout = setTimeout(() => {
          if (isMounted && !isInitialized) {
            console.log("⏰ Auth initialization timeout - setting loading to false");
            setIsLoading(false);
            setIsInitialized(true);
          }
        }, 10000); // 10 second timeout

        console.log("📡 Getting initial session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Error getting session:", error);
          if (isMounted) {
            setIsLoading(false);
            setIsInitialized(true);
          }
          return;
        }
        
        console.log("📋 Initial session:", { hasSession: !!session, hasUser: !!session?.user });
        
        if (session?.user && isMounted) {
          console.log("👤 Setting initial user and session");
          setUser(session.user);
          setSession(session);
          
          // Defer role fetching to avoid blocking
          setTimeout(() => {
            if (isMounted) {
              refreshUserRole(session.user);
            }
          }, 100);
        }
        
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
          clearTimeout(initializationTimeout);
        }
      } catch (error) {
        console.error("💥 Error initializing auth:", error);
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
          clearTimeout(initializationTimeout);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    console.log("👂 Setting up auth state listener...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log("🔔 Auth event:", event, { hasSession: !!session, hasUser: !!session?.user });
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log("🔑 Password recovery event");
          setIsPasswordRecovery(true);
          setUser(session?.user ?? null);
          setSession(session);
          setIsLoading(false);
          return;
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("👋 User signed out");
          setIsPasswordRecovery(false);
          setUserRole(null);
          setSubscriptionPlan(null);
          setUser(null);
          setSession(null);
          setIsLoading(false);
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("🎉 User signed in successfully");
          setIsPasswordRecovery(false);
          setUser(session.user);
          setSession(session);
          setIsLoading(false);
          
          // Defer role fetching
          setTimeout(() => {
            if (isMounted) {
              refreshUserRole(session.user);
            }
          }, 100);
          return;
        }
        
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("🔄 Token refreshed");
          setUser(session.user);
          setSession(session);
          return;
        }

        // For any other event, ensure loading is false
        setIsLoading(false);
      }
    );

    return () => {
      console.log("🧹 Cleaning up auth context");
      isMounted = false;
      subscription.unsubscribe();
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, []); // Empty dependency array - only run once

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log("📝 SignUp attempt:", email);
    setIsLoading(true);
    
    try {
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
        console.error("❌ SignUp error:", error);
        throw error;
      }

      console.log("✅ SignUp successful:", data.user?.email);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log("🔐 SignIn attempt:", email);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("❌ SignIn error:", error);
        throw error;
      }
      
      console.log("✅ SignIn successful:", data.user?.email);
      // The auth state listener will handle the rest
    } catch (error) {
      console.error("💥 SignIn exception:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log("👋 SignOut initiated");
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ SignOut error:", error);
        throw error;
      }
      
      console.log("✅ SignOut successful");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log("🔑 Password reset attempt for:", email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`
    });

    if (error) {
      console.error("❌ Password reset error:", error);
      throw error;
    }

    console.log("✅ Password reset email sent successfully");
  };

  const updatePassword = async (newPassword: string) => {
    console.log("🔑 Password update attempt");
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error("❌ Password update error:", error);
      throw error;
    }

    console.log("✅ Password updated successfully");
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

  console.log("📊 AuthProvider context value:", {
    hasUser: !!user,
    isAuthenticated: !!user && !isPasswordRecovery,
    userRole,
    isLoading,
    isPasswordRecovery,
    timestamp: new Date().toISOString()
  });

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
