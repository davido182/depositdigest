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
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  refreshUserRole: (currentUser?: User) => Promise<void>;
  isLandlord: boolean;
  isTenant: boolean;
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
      console.log('🔐 AuthContext: Iniciando login');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ AuthContext: Error en login:', error.message);
        throw error;
      }
      
      console.log('✅ AuthContext: Login exitoso');
      return data;
    } catch (error) {
      console.error('❌ AuthContext: Excepción en signIn:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
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
      console.log('👋 AuthContext: Iniciando logout');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsPasswordRecovery(false);
      
      // Clear localStorage
      localStorage.removeItem('rentaflux_has_visited');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ AuthContext: Error en logout:', error.message);
        throw error;
      }
      
      console.log('✅ AuthContext: Logout exitoso');
    } catch (error) {
      console.error('❌ AuthContext: Excepción en signOut:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
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
        console.log('✅ AuthContext: Sesión existente encontrada');
        setUser(session.user);
        setSession(session);
        // Delay para evitar race conditions
        setTimeout(() => {
          refreshUserRole(session.user);
        }, 1000);
      } else {
        console.log('ℹ️ AuthContext: No hay sesión existente');
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

    // Initialize auth
    initializeAuth();

    // Set timeout for initialization
    initializationTimeout = setTimeout(() => {
      if (isMounted && !isInitialized) {
        console.log('⏰ AuthContext: Timeout de inicialización alcanzado');
        setIsLoading(false);
        setIsInitialized(true);
      }
    }, 30000); // 30 second timeout

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthContext: Auth state change:', event, !!session?.user);
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('👤 AuthContext: Usuario logueado');
              setIsPasswordRecovery(false);
              setUser(session.user);
              setSession(session);
              setIsLoading(false);
              
              // Delay role refresh to avoid race conditions
              setTimeout(() => {
                if (isMounted) {
                  refreshUserRole(session.user);
                }
              }, 2000);
              setIsInitialized(true);
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 AuthContext: Usuario deslogueado');
            // Report unexpected logout if not initiated by user
            if (!isLoading) {
              console.log('🚨 Logout inesperado detectado');
            }
            setIsPasswordRecovery(false);
            setUserRole(null);
            setUser(null);
            setSession(null);
            setIsLoading(false);
            setIsInitialized(true);
            break;
            
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              console.log('🔄 AuthContext: Token refrescado');
              setUser(session.user);
              setSession(session);
              setIsLoading(false);
              setIsInitialized(true);
            }
            break;
            
          default:
            console.log('❓ AuthContext: Evento no manejado:', event);
        }
      }
    );
    
    // Session monitoring disabled for build compatibility

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      // sessionMonitor.stopMonitoring(); // Disabled for build compatibility
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
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
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUserRole,
    isLandlord,
    isTenant,
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