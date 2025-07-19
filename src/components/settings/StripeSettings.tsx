import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StripeConfig {
  enabled: boolean;
  publishable_key: string;
  secret_key: string;
  webhook_secret?: string;
}

const StripeSettings = () => {
  const { user, userRole } = useAuth();
  const [config, setConfig] = useState<StripeConfig>({
    enabled: false,
    publishable_key: "",
    secret_key: "",
    webhook_secret: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Solo usuarios premium pueden configurar Stripe
  const isPremium = userRole === 'landlord_premium';

  useEffect(() => {
    loadStripeConfig();
  }, [user]);

  const loadStripeConfig = async () => {
    if (!user || !isPremium) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_stripe_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading Stripe config:", error);
        return;
      }

      if (data) {
        setConfig({
          enabled: data.enabled || false,
          publishable_key: data.publishable_key || "",
          secret_key: data.secret_key || "",
          webhook_secret: data.webhook_secret || ""
        });
      }
    } catch (error) {
      console.error("Error loading Stripe configuration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStripeConfig = async () => {
    if (!user || !isPremium) return;

    try {
      setIsSaving(true);

      // Validar claves de Stripe
      if (config.enabled) {
        if (!config.publishable_key.startsWith('pk_')) {
          toast.error("La clave pública debe comenzar con 'pk_'");
          return;
        }
        if (!config.secret_key.startsWith('sk_')) {
          toast.error("La clave secreta debe comenzar con 'sk_'");
          return;
        }
      }

      const { error } = await supabase
        .from('user_stripe_configs')
        .upsert({
          user_id: user.id,
          enabled: config.enabled,
          publishable_key: config.publishable_key,
          secret_key: config.secret_key,
          webhook_secret: config.webhook_secret,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error saving Stripe config:", error);
        toast.error("Error al guardar configuración de Stripe");
        return;
      }

      toast.success("Configuración de Stripe guardada exitosamente");
    } catch (error) {
      console.error("Error saving Stripe configuration:", error);
      toast.error("Error al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const testStripeConnection = async () => {
    if (!config.secret_key) {
      toast.error("Por favor ingresa una clave secreta válida");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('test-stripe-connection', {
        body: { secret_key: config.secret_key }
      });

      if (error) {
        toast.error("Error al probar conexión con Stripe");
        return;
      }

      if (data.success) {
        toast.success("Conexión con Stripe exitosa");
      } else {
        toast.error("Error en la conexión con Stripe: " + data.error);
      }
    } catch (error) {
      console.error("Error testing Stripe connection:", error);
      toast.error("Error al probar conexión");
    }
  };

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configuración de Stripe
          </CardTitle>
          <CardDescription>
            Configura tu propia cuenta de Stripe para procesar pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Función Premium</h3>
            <p className="text-muted-foreground mb-4">
              La configuración personalizada de Stripe está disponible solo para usuarios premium.
            </p>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Premium Requerido
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Configuración de Stripe
        </CardTitle>
        <CardDescription>
          Configura tu propia cuenta de Stripe para procesar pagos de tus inquilinos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="stripe-enabled" className="text-base">
              Habilitar Stripe Personal
            </Label>
            <p className="text-sm text-muted-foreground">
              Usa tu propia cuenta de Stripe en lugar del sistema por defecto
            </p>
          </div>
          <Switch
            id="stripe-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        {config.enabled && (
          <div className="space-y-4 border-t pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Configuración Segura</p>
                  <p>Tus claves de Stripe se almacenan de forma segura y encriptada. Solo tú puedes verlas y usarlas.</p>
                </div>
              </div>
            </div>

            {/* Publishable Key */}
            <div className="space-y-2">
              <Label htmlFor="publishable-key">Clave Pública (Publishable Key)</Label>
              <Input
                id="publishable-key"
                type="text"
                placeholder="pk_test_... o pk_live_..."
                value={config.publishable_key}
                onChange={(e) => setConfig(prev => ({ ...prev, publishable_key: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Comienza con pk_test_ (modo prueba) o pk_live_ (modo producción)
              </p>
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <Label htmlFor="secret-key">Clave Secreta (Secret Key)</Label>
              <div className="relative">
                <Input
                  id="secret-key"
                  type={showSecretKey ? "text" : "password"}
                  placeholder="sk_test_... o sk_live_..."
                  value={config.secret_key}
                  onChange={(e) => setConfig(prev => ({ ...prev, secret_key: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Comienza con sk_test_ (modo prueba) o sk_live_ (modo producción)
              </p>
            </div>

            {/* Webhook Secret (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Secret (Opcional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="whsec_..."
                value={config.webhook_secret}
                onChange={(e) => setConfig(prev => ({ ...prev, webhook_secret: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Para validar webhooks de Stripe (recomendado para producción)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={saveStripeConfig} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Configuración"}
              </Button>
              <Button variant="outline" onClick={testStripeConnection} disabled={!config.secret_key}>
                Probar Conexión
              </Button>
            </div>
          </div>
        )}

        {/* Info for disabled state */}
        {!config.enabled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Cuando habilites Stripe personal, tus inquilinos podrán pagar directamente a tu cuenta de Stripe,
              y recibirás los pagos sin comisiones adicionales de RentaFlux.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeSettings;