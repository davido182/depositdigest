import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie, ExternalLink } from "lucide-react";

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('rentaflux_cookie_consent');
    if (!cookieConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('rentaflux_cookie_consent', 'accepted');
    localStorage.setItem('rentaflux_cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('rentaflux_cookie_consent', 'rejected');
    localStorage.setItem('rentaflux_cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/20 backdrop-blur-sm">
      <Card className="max-w-4xl mx-auto p-6 shadow-lg border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <Cookie className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              🍪 Uso de Cookies
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Utilizamos cookies técnicas estrictamente necesarias para el funcionamiento de RentaFlux. 
              Estas cookies son esenciales para que puedas iniciar sesión, navegar por la plataforma 
              y utilizar sus funciones de forma segura.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex gap-2">
                <Button 
                  onClick={acceptCookies}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Aceptar cookies necesarias
                </Button>
                <Button 
                  onClick={rejectCookies}
                  variant="outline"
                  size="sm"
                >
                  Rechazar
                </Button>
              </div>
              
              <a 
                href="/cookies" 
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Más información sobre cookies
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ℹ️ <strong>Importante:</strong> Si rechazas las cookies técnicas, es posible que algunas 
            funciones de RentaFlux no funcionen correctamente (inicio de sesión, pagos seguros, etc.).
          </p>
        </div>
      </Card>
    </div>
  );
};