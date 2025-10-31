import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import { debugDatabaseStructure } from "@/utils/debugDatabase";
import { useEffect } from "react";

export function SmartHome() {
  const { isAuthenticated, isLoading } = useAuth();

  // Debug database structure on load
  useEffect(() => {
    // Removed console.log for security
    debugDatabaseStructure();
  }, []);

  // Removed console.log for security

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // SIEMPRE mostrar landing en la ruta raíz (/), sin importar si está autenticado
  // Los usuarios autenticados deben ir a /dashboard manualmente
  // Removed console.log for security');
  return <Landing />;
}
