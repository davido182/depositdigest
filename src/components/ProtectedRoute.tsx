
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, userRole, user } = useAuth();
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  console.log("🛡️ ProtectedRoute render:", { 
    isAuthenticated, 
    isLoading, 
    userRole, 
    hasUser: !!user,
    showTimeoutError,
    timestamp: new Date().toISOString()
  });

  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      console.log("⏰ Starting ProtectedRoute timeout timer...");
      const timeout = setTimeout(() => {
        console.log("⚠️ ProtectedRoute timeout reached - forcing redirect");
        setShowTimeoutError(true);
      }, 15000); // 15 seconds timeout

      return () => {
        console.log("🧹 Clearing ProtectedRoute timeout");
        clearTimeout(timeout);
      };
    }
  }, [isLoading]);

  // Show timeout error
  if (showTimeoutError) {
    console.log("💥 ProtectedRoute: showing timeout error");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground">Error de Conexión</h2>
          <p className="text-muted-foreground">
            Hubo un problema al cargar la aplicación. Por favor, recarga la página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner
  if (isLoading) {
    console.log("🔄 ProtectedRoute: showing loading spinner");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
          <p className="text-sm text-muted-foreground/60">
            Verificando autenticación...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to home (landing) if not authenticated
  if (!isAuthenticated) {
    console.log("🚫 ProtectedRoute: user not authenticated, redirecting to home");
    return <Navigate to="/" replace />;
  }

  console.log("✅ ProtectedRoute: user authenticated, rendering outlet");
  return <Outlet />;
};

export default ProtectedRoute;
