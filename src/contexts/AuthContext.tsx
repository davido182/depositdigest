import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
// sessionMonitor removed for build compatibility

export type UserRole = 'landlord_free' | 'landlord_premium' | 'tenant';
export type AppPlan = 'free' | 'premium';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  subscriptionPlan: AppPlan | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
  refreshUserRole: (currentUser?: User) => Promise<void>;
  checkSubscription: () => Promise<void>;
  createCheckoutSession: () => Promise<string>;
  upgradeUserToPremium: (userId?: string) => Promise<void>;
  isLandlord: boolean;
  isTenant: boolean;
  isPremium: boolean;
  hasActivePremium: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<AppPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Computed properties
  const isLandlord = userRole === 'landlord_free' || userRole === 'landlord_premium';
  const isTenant = userRole === 'tenant';
  const isPremium = userRole === 'landlord_premium';
  const hasActivePremium = userRole === 'landlord_premium';
  const isAuthenticated = !!user && !isPasswordRecovery;

  const refreshUserRole = async (currentUser?: User): Promise<void> => {
    const userToCheck = currentUser || user;
    
    if (!userToCheck) {
      setUserRole(null);
      return;
    }

    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userToCheck.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error('❌ AuthContext: Error en refreshUserRole:', roleError);
        setUserRole('landlord_free');
        return;
      }

      if (!roleData) {
        // Create new user role
        const { data: newRoleData, error: createError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userToCheck.id,
            role: 'landlord_premium' as UserRole
          }])
          .select('role')
          .single();

        if (createError) {
          console.error('Error creating user role:', createError);
          setUserRole('landlord_free');
        } else {
          setUserRole(newRoleData.role as UserRole);
          setSubscriptionPlan(newRoleData.role === 'landlord_premium' ? 'premium' : 'free');
        }
      } else {
        setUserRole(roleData.role as UserRole);
        setSubscriptionPlan(roleData.role === 'landlord_premium' ? 'premium' : 'free');
      }
    } catch (error) {
      console.error('❌ AuthContext: Excepción en refreshUserRole:', error);
      setUserRole('landlord_free');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        console.error('❌ AuthContext: Error en login:', error.message);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('❌ AuthContext: Excepción en signIn:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      // Limpiar estado local primero
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsPasswordRecovery(false);
      localStorage.removeItem('rentaflux_has_visited');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ AuthContext: Error en logout:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('❌ AuthContext: Excepción en signOut:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  };

  const checkSubscription = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('❌ Subscription check error:', error);
        return;
      }
      if (data) {
        setSubscriptionPlan(data.plan);
        if (data.plan === 'premium' && userRole === 'landlord_free') {
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role: 'landlord_premium' })
            .eq('user_id', user.id);
          if (!updateError) setUserRole('landlord_premium');
        }
      }
    } catch (error) {
      console.error('💥 Error checking subscription:', error);
    }
  };

  const createCheckoutSession = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('create-checkout');
    if (error) throw error;
    return data.url;
  };

  const upgradeUserToPremium = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: targetUserId,
          role: 'landlord_premium' as UserRole,
          trial_end_date: trialEndDate.toISOString()
        }, { onConflict: 'user_id' });
      if (error) throw error;
      await refreshUserRole();
    } catch (error) {
      console.error('💥 Exception upgrading to premium:', error);
    }
  };

  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ AuthContext: Error obteniendo sesión:', error);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        setTimeout(() => {
          refreshUserRole(session.user);
        }, 1000);
      }
      setIsLoading(false);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;

    initializeAuth();

    initializationTimeout = setTimeout(() => {
      if (isMounted && !isInitialized) {
        setIsLoading(false);
        setIsInitialized(true);
      }
    }, 30000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
            if (session?.user) {
              setIsPasswordRecovery(false);
              setUser(session.user);
              setSession(session);
              setIsLoading(false);
              setTimeout(() => {
                if (isMounted) refreshUserRole(session.user);
              }, 2000);
              setIsInitialized(true);
            }
            break;

          case 'SIGNED_OUT':
            setIsPasswordRecovery(false);
            setUserRole(null);
            setUser(null);
            setSession(null);
            setIsLoading(false);
            setIsInitialized(true);
            break;

          case 'PASSWORD_RECOVERY':
            if (session?.user) {
              setUser(session.user);
              setSession(session);
              setIsPasswordRecovery(true);
              setIsLoading(false);
              setIsInitialized(true);
              // Navigate without hard reload so React state is preserved
              window.history.replaceState(null, '', '/reset-password');
            }
            break;

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              setUser(session.user);
              setSession(session);
              setIsLoading(false);
              setIsInitialized(true);
            }
            break;

          default:
            break;
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (initializationTimeout) clearTimeout(initializationTimeout);
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    userRole,
    subscriptionPlan,
    isLoading,
    isPasswordRecovery,
    isInitialized,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUserRole,
    checkSubscription,
    createCheckoutSession,
    upgradeUserToPremium,
    isLandlord,
    isTenant,
    isPremium,
    hasActivePremium,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}