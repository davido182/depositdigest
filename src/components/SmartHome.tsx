import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import { debugDatabaseStructure } from "@/utils/debugDatabase";
import { useEffect } from "react";

export function SmartHome() {
  const { isAuthenticated, isLoading } = useAuth();

  // Debug database structure on load
  useEffect(() => {
    console.log('🏠 SmartHome: Component mounted');
    debugDatabaseStructure();
  }, []);

  console.log('🏠 SmartHome render:', { isAuthenticated, isLoading });

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // SIEMPRE mostrar landing en la ruta raíz, sin importar si está autenticado
  console.log('🏠 SmartHome: Showing landing (root path always shows landing)');
  return <Landing />;
}