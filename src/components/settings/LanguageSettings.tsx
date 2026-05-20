
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences, type DateFormat } from "@/contexts/UserPreferencesContext";

export function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const { dateFormat, setDateFormat } = useUserPreferences();

  useEffect(() => {
    // Forzar español por defecto
    const savedLanguage = 'es';
    localStorage.setItem('app-language', savedLanguage);
    setSelectedLanguage(savedLanguage);
    // Removed console.log for security
  }, []);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    localStorage.setItem('app-language', language);
    
    if (language === 'es') {
      toast.success("Idioma configurado en Español");
    } else {
      toast.success("Language changed to English. La aplicación se recargará para aplicar los cambios.");
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
              <SelectItem value="es">🇪🇸 Español (Predeterminado)</SelectItem>
              <SelectItem value="en">🇺🇸 English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p>
            <strong>Nota:</strong> La aplicación está configurada en Español por defecto. 
            Todos los textos y títulos aparecen en español. Al cambiar al inglés, 
            la página se recargará automáticamente para aplicar los cambios.
          </p>
        </div>

        {/* Formato de Fecha */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="dateFormat" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Formato de Fecha
          </Label>
          <Select 
            value={dateFormat} 
            onValueChange={(value) => {
              setDateFormat(value as DateFormat);
              toast.success(`Formato de fecha cambiado a ${value}`);
            }}
          >
            <SelectTrigger id="dateFormat">
              <SelectValue placeholder="Seleccionar formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Día/Mes/Año) - Europeo</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (Mes/Día/Año) - Americano</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (Año-Mes-Día) - ISO</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Ejemplo: {dateFormat === 'DD/MM/YYYY' ? '31/12/2024' : dateFormat === 'MM/DD/YYYY' ? '12/31/2024' : '2024-12-31'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
