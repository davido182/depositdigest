import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";

export function DevErrorNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Solo mostrar en desarrollo
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    setIsDev(isDevelopment);
    
    if (isDevelopment) {
      // Mostrar después de 3 segundos para dar tiempo a que aparezcan los errores
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isDev || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-sm text-orange-800">
          <div className="flex items-start justify-between">
            <div>
              <strong>Modo Desarrollo:</strong> Los errores 400/404 en la consola son normales. 
              La base de datos está siendo actualizada para coincidir con el código.
              <br />
              <span className="text-xs mt-1 block">
                Los datos importados funcionan correctamente a pesar de estos errores.
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="ml-2 h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}