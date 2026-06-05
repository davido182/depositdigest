import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe, Calendar, Check } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences, type DateFormat } from "@/contexts/UserPreferencesContext";
import { useI18n, type Language } from "@/contexts/i18nContext";

export function LanguageSettings() {
  const { dateFormat, setDateFormat } = useUserPreferences();
  const { language, setLanguage, t } = useI18n();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
    toast.success(
      value === 'es'
        ? '✅ Idioma cambiado a Español'
        : '✅ Language changed to English',
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t.languageSettings.title}
        </CardTitle>
        <CardDescription>{t.languageSettings.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language selector */}
        <div className="space-y-2">
          <Label htmlFor="language">{t.languageSettings.label}</Label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language" className="w-full">
              <SelectValue placeholder={t.languageSettings.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">
                <span className="flex items-center gap-2">
                  {t.languageSettings.spanish}
                  {language === 'es' && <Check className="h-3 w-3 text-primary" />}
                </span>
              </SelectItem>
              <SelectItem value="en">
                <span className="flex items-center gap-2">
                  {t.languageSettings.english}
                  {language === 'en' && <Check className="h-3 w-3 text-primary" />}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {language === 'es'
              ? 'La interfaz se actualizará automáticamente al cambiar de idioma.'
              : 'The interface updates automatically when you change the language.'}
          </p>
        </div>

        {/* Date format */}
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="dateFormat" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t.languageSettings.dateFormatLabel}
          </Label>
          <Select
            value={dateFormat}
            onValueChange={(value) => {
              setDateFormat(value as DateFormat);
              toast.success(
                language === 'es'
                  ? `Formato cambiado a ${value}`
                  : `Format changed to ${value}`,
              );
            }}
          >
            <SelectTrigger id="dateFormat">
              <SelectValue placeholder={t.languageSettings.dateFormatPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY — {language === 'es' ? 'Europeo' : 'European'}</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY — {language === 'es' ? 'Americano' : 'American'}</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD — ISO 8601</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'Ejemplo' : 'Example'}:{' '}
            {dateFormat === 'DD/MM/YYYY' ? '31/12/2024' : dateFormat === 'MM/DD/YYYY' ? '12/31/2024' : '2024-12-31'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
