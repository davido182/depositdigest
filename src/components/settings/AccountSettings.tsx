
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, LogOut, Crown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function AccountSettings() {
  const { user, signOut, userRole } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error("Error al actualizar contraseña: " + error.message);
      } else {
        toast.success("Contraseña actualizada exitosamente");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error("Error al actualizar contraseña");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      console.log('Iniciando cierre de sesión...');
      await signOut();
      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error("Error al cerrar sesión");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Configuración de Cuenta
        </CardTitle>
        <CardDescription>
          Gestiona tu información de cuenta y seguridad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Dirección de Email</div>
              <div className="text-sm text-muted-foreground">{user?.email || 'No disponible'}</div>
            </div>
          </div>
        </div>

        {/* Password Update */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <h4 className="font-medium">Cambiar Contraseña</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa nueva contraseña"
                minLength={6}
              />
            </div>
            
            <div>
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma nueva contraseña"
                minLength={6}
              />
            </div>
            
            <Button 
              onClick={handlePasswordUpdate}
              disabled={isUpdating || !newPassword || !confirmPassword}
              className="w-full"
            >
              {isUpdating ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </div>
        </div>

        {/* Upgrade to Premium */}
        {userRole === 'landlord_free' && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <h4 className="font-medium">Plan Premium</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Desbloquea todas las funciones premium: propiedades ilimitadas, invitaciones de inquilinos, reportes avanzados y más.
            </p>
            <Button 
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('create-checkout', {
                    body: { 
                      email: user?.email,
                      priceId: 'price_1QdFz0DKXqPjJWpJqwgNLYkr'
                    }
                  });
                  
                  if (error) throw error;
                  
                  if (data?.url) {
                    window.open(data.url, '_blank');
                  }
                } catch (error) {
                  console.error('Error creating checkout:', error);
                  toast.error('Error al procesar el pago');
                }
              }}
              className="w-full gap-2"
            >
              <Crown className="h-4 w-4" />
              Actualizar a Premium - €29/mes
            </Button>
          </div>
        )}

        {/* Sign Out */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
