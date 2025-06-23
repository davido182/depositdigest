
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { toast } from "sonner";

export function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    // Load saved language preference - default to English
    const savedLanguage = localStorage.getItem('app-language') || 'en';
    setSelectedLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    localStorage.setItem('app-language', language);
    
    // Show confirmation message in selected language
    if (language === 'es') {
      toast.success("Idioma cambiado a Español. La aplicación se recargará para aplicar los cambios.");
    } else {
      toast.success("Language changed to English. The application will reload to apply changes.");
    }
    
    // Reload the page to apply language changes
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Language Settings
        </CardTitle>
        <CardDescription>
          Choose your preferred language for the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language">Application Language</Label>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇺🇸 English (Default)</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p>
            <strong>Note:</strong> The application defaults to English. When you change the language, 
            the page will reload automatically to apply the new language settings throughout the application.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
