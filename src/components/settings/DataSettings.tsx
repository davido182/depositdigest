
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Database, Mail, Shield, Clock, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function DataSettings() {
  const { user } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [showCodeVerification, setShowCodeVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [backups, setBackups] = useState([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  const generateSecureVerificationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const loadBackups = async () => {
    if (!user?.id) return;
    
    setIsLoadingBackups(true);
    try {
      const { data, error } = await supabase
        .from('data_backups')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_restored', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error("Error al cargar respaldos");
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!user?.email) {
      toast.error("No se encontró dirección de correo para verificación");
      return;
    }

    setIsSendingCode(true);
    try {
      const code = generateSecureVerificationCode();
      setGeneratedCode(code);
      
      // En una aplicación real, enviarías esto por email
      // Para demostración, lo mostramos en un toast
      toast.success(`Código de verificación enviado a ${user.email}: ${code}`, {
        duration: 15000,
      });
      
      setShowCodeVerification(true);
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast.error("Error al enviar código de verificación");
    } finally {
      setIsSendingCode(false);
    }
  };

  const createDataBackup = async () => {
    if (!user?.id) return null;

    try {
      // Recopilar todos los datos actuales
      const allData = {
        tenants: JSON.parse(localStorage.getItem('tenants') || '[]'),
        payments: JSON.parse(localStorage.getItem('payments') || '[]'),
        maintenance_requests: JSON.parse(localStorage.getItem('maintenance_requests') || '[]'),
        accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
        accounting_entries: JSON.parse(localStorage.getItem('accounting_entries') || '[]'),
        tax_entries: JSON.parse(localStorage.getItem('tax_entries') || '[]'),
        unitCount: localStorage.getItem('unit-count'),
        totalUnits: localStorage.getItem('totalUnits'),
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('data_backups')
        .insert({
          user_id: user.id,
          backup_data: allData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  };

  const clearAllData = async () => {
    if (!verificationCode || verificationCode !== generatedCode) {
      toast.error("Código de verificación inválido");
      return;
    }

    setIsClearing(true);
    try {
      // Crear respaldo antes de borrar
      await createDataBackup();
      
      // Limpiar todos los datos de localStorage incluyendo contabilidad
      const keysToRemove = [
        'tenants',
        'payments', 
        'maintenance_requests',
        'accounts',
        'accounting_entries',
        'tax_entries',
        'unit-count',
        'totalUnits'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`DataSettings: Removed ${key} from localStorage`);
      });
      
      console.log('DataSettings: Todos los datos de la aplicación han sido eliminados');
      toast.success("Todos los datos han sido eliminados exitosamente. Tienes 24 horas para restaurarlos. La página se recargará.", {
        duration: 5000
      });
      
      // Resetear estado de verificación
      setShowCodeVerification(false);
      setVerificationCode("");
      setGeneratedCode("");
      
      // Recargar la página para reiniciar todos los componentes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error("Error al eliminar datos. Por favor intenta de nuevo.");
    } finally {
      setIsClearing(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    try {
      const { data: backup, error } = await supabase
        .from('data_backups')
        .select('*')
        .eq('id', backupId)
        .single();

      if (error) throw error;

      const backupData = backup.backup_data;
      
      // Restaurar todos los datos
      if (backupData.tenants) localStorage.setItem('tenants', JSON.stringify(backupData.tenants));
      if (backupData.payments) localStorage.setItem('payments', JSON.stringify(backupData.payments));
      if (backupData.maintenance_requests) localStorage.setItem('maintenance_requests', JSON.stringify(backupData.maintenance_requests));
      if (backupData.accounts) localStorage.setItem('accounts', JSON.stringify(backupData.accounts));
      if (backupData.accounting_entries) localStorage.setItem('accounting_entries', JSON.stringify(backupData.accounting_entries));
      if (backupData.tax_entries) localStorage.setItem('tax_entries', JSON.stringify(backupData.tax_entries));
      if (backupData.unitCount) localStorage.setItem('unit-count', backupData.unitCount);
      if (backupData.totalUnits) localStorage.setItem('totalUnits', backupData.totalUnits);

      // Marcar respaldo como restaurado
      await supabase
        .from('data_backups')
        .update({ is_restored: true })
        .eq('id', backupId);

      toast.success("Datos restaurados exitosamente. La página se recargará.");
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error("Error al restaurar respaldo");
    }
  };

  React.useEffect(() => {
    loadBackups();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestión de Datos
          </CardTitle>
          <CardDescription>
            Administra los datos de tu aplicación y reinicia para empezar de nuevo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-amber-600">⚠️</div>
              <div className="text-sm text-amber-800">
                <p className="font-medium">Advertencia: Eliminación de Datos</p>
                <p>Esta acción eliminará permanentemente todos tus inquilinos, pagos, solicitudes de mantenimiento, datos contables y otros datos de la aplicación. Tendrás 24 horas para restaurar los datos desde un respaldo.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Verificación de Seguridad Requerida</p>
                <p>Para tu protección, enviaremos un código de verificación de 8 dígitos a tu correo antes de eliminar tus datos.</p>
              </div>
            </div>
          </div>

          {!showCodeVerification ? (
            <Button 
              onClick={sendVerificationCode}
              disabled={isSendingCode}
              className="w-full"
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSendingCode ? "Enviando Código..." : "Enviar Código de Verificación"}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Ingresa el Código de Verificación</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="Ingresa código de 8 dígitos"
                  maxLength={8}
                />
                <p className="text-sm text-muted-foreground">
                  Revisa tu correo ({user?.email}) para el código de verificación
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={clearAllData}
                  disabled={isClearing || !verificationCode}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isClearing ? "Eliminando Datos..." : "Confirmar Eliminación de Todos los Datos"}
                </Button>
                
                <Button 
                  onClick={() => {
                    setShowCodeVerification(false);
                    setVerificationCode("");
                    setGeneratedCode("");
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {backups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Respaldos Disponibles (24 horas)
            </CardTitle>
            <CardDescription>
              Puedes restaurar tus datos desde estos respaldos durante las próximas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backups.map((backup: any) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      Respaldo del {new Date(backup.created_at).toLocaleString('es-ES')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expira: {new Date(backup.expires_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <Button
                    onClick={() => restoreBackup(backup.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
