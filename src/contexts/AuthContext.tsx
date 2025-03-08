
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on mount
  useEffect(() => {
    console.log("AuthProvider initializing");
    try {
      const storedUser = localStorage.getItem("rentflow_user");
      if (storedUser) {
        console.log("Found stored user");
        setUser(JSON.parse(storedUser));
      } else {
        console.log("No stored user found");
      }
    } catch (error) {
      console.error("Error loading stored user:", error);
    } finally {
      setIsLoading(false);
      console.log("AuthProvider initialization complete");
    }
  }, []);

  // Mock login function (replace with real auth later)
  const login = async (email: string, password: string) => {
    console.log("Login attempt:", email);
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation - in a real app, this would be a server call
    if (email === "admin@example.com" && password === "password") {
      const newUser = {
        id: "1",
        name: "Admin User",
        email: email
      };
      
      console.log("Login successful");
      setUser(newUser);
      localStorage.setItem("rentflow_user", JSON.stringify(newUser));
      setIsLoading(false);
      return;
    }
    
    console.log("Login failed");
    setIsLoading(false);
    throw new Error("Invalid email or password");
  };

  const logout = () => {
    console.log("Logging out");
    setUser(null);
    localStorage.removeItem("rentflow_user");
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
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
