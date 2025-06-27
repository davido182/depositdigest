
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { toast } from "sonner";

export function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState("es");

  useEffect(() => {
    // Load saved language preference - default to Spanish
    const savedLanguage = localStorage.getItem('app-language') || 'es';
    setSelectedLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    localStorage.setItem('app-language', language);
    
    // Show confirmation message in selected language
    if (language === 'es') {
      toast.success("Idioma configurado en Español");
    } else {
      toast.success("Language changed to English. The application will reload to apply changes.");
      
      // Reload the page to apply language changes only for English
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Configuración de Idioma
        </CardTitle>
        <CardDescription>
          Elige tu idioma preferido para la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language">Idioma de la Aplicación</Label>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Seleccionar idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">🇪🇸 Español (Por defecto)</SelectItem>
              <SelectItem value="en">🇺🇸 English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p>
            <strong>Nota:</strong> La aplicación está configurada por defecto en Español. 
            Al cambiar al inglés, la página se recargará automáticamente para aplicar 
            la nueva configuración de idioma en toda la aplicación.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
