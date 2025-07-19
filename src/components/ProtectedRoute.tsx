
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, userRole, user } = useAuth();

  console.log("🛡️ ProtectedRoute render:", { 
    isAuthenticated, 
    isLoading, 
    userRole, 
    hasUser: !!user,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    console.log("🔄 ProtectedRoute: showing loading spinner");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("🚫 ProtectedRoute: user not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ ProtectedRoute: user authenticated, rendering outlet");
  return <Outlet />;
};

export default ProtectedRoute;
