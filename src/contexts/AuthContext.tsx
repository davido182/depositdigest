
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Setting up Supabase auth listener");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        // Handle password recovery flow
        if (event === 'PASSWORD_RECOVERY') {
          console.log("Password recovery event detected");
          // Don't set the session yet, just the user for password update
          setUser(session?.user ?? null);
          setSession(session);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      console.log("AuthProvider: Cleaning up auth listener");
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
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword
  };

  console.log("AuthProvider rendering, isAuthenticated:", !!user, "isLoading:", isLoading);

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
