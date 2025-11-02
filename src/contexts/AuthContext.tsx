
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
  upgradeUserToPremium: (userId?: string) => Promise<void>;
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

  // AuthProvider initialized
  });

  // Computed properties
  const isLandlord = userRole === 'landlord_free' || userRole === 'landlord_premium';
  const isTenant = userRole === 'tenant';
  const isPremium = userRole === 'landlord_premium';
  const hasActivePremium = userRole === 'landlord_premium';

  // Manual function to upgrade user to premium (for testing)
  const upgradeUserToPremium = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      console.error("❌ No user ID provided for premium upgrade");
      return;
    }

    try {
      // Upgrading user to premium
      
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: targetUserId,
          role: 'landlord_premium' as UserRole
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("❌ Error upgrading to premium:", error);
        throw error;
      }

      // Removed console.log for security
      // Refresh the role
      await refreshUserRole();
      
    } catch (error) {
      console.error("💥 Exception upgrading to premium:", error);
    }
  };

  const refreshUserRole = async (currentUser?: User) => {
    const userToCheck = currentUser || user;
    
    console.log("🔄 refreshUserRole called:", { 
      hasUser: !!userToCheck, 
      userId: userToCheck?.id,
      email: userToCheck?.email,
      timestamp: new Date().toISOString()
    });
    
    if (!userToCheck) {
      // Removed console.log for security
      setUserRole(null);
      return;
    }

    try {
      // Removed console.log for security
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, trial_end_date')
        .eq('user_id', userToCheck.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      // Removed console.log for security

      if (roleError) {
        console.error('❌ AuthContext: Error en refreshUserRole:', roleError);
        setUserRole('landlord_free');
        return;
      }

      if (!roleData) {
        // Removed console.log for security
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 días de prueba premium
        
        // Creating new user role
          trial_end_date: trialEndDate.toISOString()
        });
        
        const { data: newRoleData, error: createError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userToCheck.id,
            role: 'landlord_premium' as UserRole, // Empezar con premium trial
            trial_end_date: trialEndDate.toISOString()
          }])
          .select('role, trial_end_date')
          .single();
          
        // Removed console.log for security
        
        if (createError) {
          console.error("❌ Error creating user role:", createError);
          // Removed console.log for security
          setUserRole('landlord_free');
        } else {
          // Removed console.log for security
          setUserRole(newRoleData?.role || 'landlord_free');
          
          // Verificar inmediatamente en la base de datos
          // Removed console.log for security
          const { data: verifyData, error: verifyError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userToCheck.id);
          
          // Removed console.log for security
          
          // También verificar en toda la tabla
          const { data: allRoles, error: allError } = await supabase
            .from('user_roles')
            .select('*');
          
          // Removed console.log for security
        }
          
        if (createError) {
          console.error("❌ Error creating user role:", createError);
          // Removed console.log for security
          setUserRole('landlord_free');
        } else {
          // Removed console.log for security
          setUserRole(newRoleData.role);
        }
      } else {
        // Removed console.log for security
        
        // Check if trial has expired for premium users
        if (roleData.role === 'landlord_premium' && roleData.trial_end_date) {
          const trialEndDate = new Date(roleData.trial_end_date);
          const now = new Date();
          
          if (now > trialEndDate) {
            // Removed console.log for security
            
            // Update role to free in database
            const { error: updateError } = await supabase
              .from('user_roles')
              .update({ role: 'landlord_free' })
              .eq('user_id', userToCheck.id);
              
            if (updateError) {
              console.error("❌ Error downgrading expired trial:", updateError);
            } else {
              // Removed console.log for security
            }
            
            setUserRole('landlord_free');
          } else {
            // Removed console.log for security
            setUserRole(roleData.role);
          }
        } else {
          setUserRole(roleData.role);
        }
      }
    } catch (error) {
      console.error("💥 Exception in refreshUserRole:", error);
      // Removed console.log for security
      setUserRole('landlord_free');
    }
  };

  const checkSubscription = async () => {
    const currentUser = user;
    if (!currentUser) return;
    
    try {
      // Removed console.log for security
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error("❌ Subscription check error:", error);
        return;
      }
      
      if (data) {
        // Removed console.log for security
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

    // Removed console.log for security

    const initializeAuth = async () => {
      try {
        // Set timeout as fallback
        initializationTimeout = setTimeout(() => {
          if (isMounted && !isInitialized) {
            // Removed console.log for security
            setIsLoading(false);
            setIsInitialized(true);
          }
        }, 10000); // 10 second timeout

        // Removed console.log for security
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Error getting session:", error);
          if (isMounted) {
            setIsLoading(false);
            setIsInitialized(true);
          }
          return;
        }
        
        // Removed console.log for security
        
        if (session?.user && isMounted) {
          // Removed console.log for security
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
    // Removed console.log for security
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        // Removed console.log for security
        
        if (event === 'PASSWORD_RECOVERY') {
          // Removed console.log for security
          setIsPasswordRecovery(true);
          setUser(session?.user ?? null);
          setSession(session);
          setIsLoading(false);
          return;
        }
        
        if (event === 'SIGNED_UP' && session?.user) {
          // Removed console.log for security
          setUser(session.user);
          setSession(session);
          setIsLoading(false);
          
          // Force create role for new user immediately
          // Removed console.log for security
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 7);
          
          supabase
            .from('user_roles')
            .upsert({
              user_id: session.user.id,
              role: 'landlord_premium',
              trial_end_date: trialEndDate.toISOString()
            }, {
              onConflict: 'user_id'
            })
            .then(({ data, error }) => {
              // Removed console.log for security
              if (!error) {
                setUserRole('landlord_premium');
              }
            });
          
          return;
        }
        
        if (event === 'SIGNED_OUT') {
          // Removed console.log for security
          setIsPasswordRecovery(false);
          setUserRole(null);
          setSubscriptionPlan(null);
          setUser(null);
          setSession(null);
          setIsLoading(false);
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Removed console.log for security
          setIsPasswordRecovery(false);
          setUser(session.user);
          setSession(session);
          setIsLoading(false);
          
          // Force role creation/refresh immediately
          // Removed console.log for security
          refreshUserRole(session.user);
          return;
        }
        
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Removed console.log for security
          setUser(session.user);
          setSession(session);
          return;
        }

        // For any other event, ensure loading is false
        setIsLoading(false);
      }
    );

    return () => {
      // Removed console.log for security
      isMounted = false;
      subscription.unsubscribe();
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, []); // Empty dependency array - only run once

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Removed console.log for security
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

      // Removed console.log for security
      
      // If user is created and confirmed, create role immediately
      if (data.user && !data.user.email_confirmed_at) {
        // Removed console.log for security
      } else if (data.user) {
        // Removed console.log for security
        // Create role immediately for confirmed users
        setTimeout(() => {
          refreshUserRole(data.user);
        }, 500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Removed console.log for security
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
      
      // Removed console.log for security
      
      // Force role refresh after successful login
      if (data.user) {
        // Removed console.log for security
        setTimeout(() => {
          refreshUserRole(data.user);
        }, 1000);
      }
    } catch (error) {
      console.error("💥 SignIn exception:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    // Removed console.log for security
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ SignOut error:", error);
        throw error;
      }
      
      // Clear the visited flag so user sees landing page on next visit
      localStorage.removeItem('rentaflux_has_visited');
      
      // Removed console.log for security
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    // Removed console.log for security
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`
    });

    if (error) {
      console.error("❌ Password reset error:", error);
      throw error;
    }

    // Removed console.log for security
  };

  const updatePassword = async (newPassword: string) => {
    // Removed console.log for security
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error("❌ Password update error:", error);
      throw error;
    }

    // Removed console.log for security
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
    refreshUserRole,
    upgradeUserToPremium
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
