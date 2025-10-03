import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet, Users, Building, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FinalImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function FinalImport({ isOpen, onClose, onImportComplete }: FinalImportProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    // Plantilla universal con TODOS los campos reales de las tablas
    const csvContent = `tipo,name,email,phone,unit_number,lease_start_date,lease_end_date,rent_amount,status,notes,address,total_units,description,tenant_email,amount,payment_date,payment_method
inquilino,Juan Pérez,juan@email.com,555-0123,101,2024-01-01,2024-12-31,1200,active,Inquilino puntual,,,,,,
inquilino,María García,maria@email.com,555-0124,102,2024-02-01,2024-12-31,1300,active,Excelente inquilina,,,,,,
propiedad,Edificio Central,,,,,,,,,,"Calle Principal 123",10,"Edificio residencial moderno",,,,
pago,,,,,,,,,,,,,juan@email.com,1200,2024-01-01,bank_transfer`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_universal_rentaflux.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plantilla universal descargada con todos los campos');
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    return data;
  };

  const importTenants = async (tenantRows: any[]) => {
    if (!user) throw new Error('Usuario no autenticado');

    const tenants = tenantRows.map(row => ({
      // Campos obligatorios
      name: row.name || 'Sin nombre',
      email: row.email,
      lease_start_date: row.lease_start_date || new Date().toISOString().split('T')[0],
      rent_amount: parseFloat(row.rent_amount || '0') || 0,
      unit_number: row.unit_number || '',
      user_id: user.id,
      // Campos opcionales
      phone: row.phone || null,
      lease_end_date: row.lease_end_date || null,
      status: row.status || 'active',
      notes: row.notes || null,
      landlord_id: user.id
    }));

    console.log('📤 Insertando inquilinos:', tenants);

    const { data, error } = await supabase
      .from('tenants')
      .insert(tenants)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      throw new Error(`Error en inquilinos: ${error.message}`);
    }

    console.log('✅ Inquilinos insertados:', data?.length);
    return data?.length || 0;
  };

  const importProperties = async (propertyRows: any[]) => {
    if (!user) throw new Error('Usuario no autenticado');

    const properties = propertyRows.map(row => ({
      // Campos obligatorios
      name: row.name || 'Propiedad',
      user_id: user.id,
      // Campos opcionales
      address: row.address || null,
      description: row.description || null,
      total_units: parseInt(row.total_units || '1') || 1
    }));

    console.log('📤 Insertando propiedades:', properties);

    const { data, error } = await supabase
      .from('properties')
      .insert(properties)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      throw new Error(`Error en propiedades: ${error.message}`);
    }

    console.log('✅ Propiedades insertadas:', data?.length);
    return data?.length || 0;
  };

  const importPayments = async (paymentRows: any[]) => {
    if (!user) throw new Error('Usuario no autenticado');

    let successCount = 0;

    console.log('💰 Procesando pagos:', paymentRows.length);

    for (const row of paymentRows) {
      try {
        // Buscar el tenant por email
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('email', row.tenant_email)
          .eq('user_id', user.id)
          .single();

        if (tenantError || !tenant) {
          console.warn(`No se encontró inquilino: ${row.tenant_email}`);
          continue;
        }

        const { error } = await supabase
          .from('payments')
          .insert({
            tenant_id: tenant.id,
            amount: parseFloat(row.amount || '0') || 0,
            payment_date: row.payment_date || new Date().toISOString().split('T')[0],
            payment_method: row.payment_method || 'cash',
            status: row.status || 'completed',
            notes: row.notes || null,
            user_id: user.id
          });

        if (!error) {
          successCount++;
        } else {
          console.error('❌ Error en pago:', error);
        }
      } catch (error: any) {
        console.error('Error procesando pago:', error);
      }
    }

    console.log('✅ Pagos procesados:', successCount);
    return successCount;
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        toast.error('No se encontraron datos válidos');
        return;
      }

      console.log('📊 Datos parseados:', data);

      // Separar por tipo usando la columna 'tipo' y validar campos obligatorios
      const tenantRows = data.filter(row => {
        if (row.tipo !== 'inquilino') return false;

        // Validar campos obligatorios
        if (!row.name || !row.email) {
          console.error(`❌ Inquilino inválido - falta name o email:`, row);
          return false;
        }
        return true;
      });

      const propertyRows = data.filter(row => {
        if (row.tipo !== 'propiedad') return false;

        // Validar campos obligatorios
        if (!row.name) {
          console.error(`❌ Propiedad inválida - falta name:`, row);
          return false;
        }
        return true;
      });

      const paymentRows = data.filter(row => {
        if (row.tipo !== 'pago') return false;

        // Validar campos obligatorios
        if (!row.tenant_email) {
          console.error(`❌ Pago inválido - falta tenant_email:`, row);
          return false;
        }
        if (!row.amount) {
          console.error(`❌ Pago inválido - falta amount:`, row);
          return false;
        }
        return true;
      });

      console.log('📋 Filas separadas:', {
        inquilinos: tenantRows.length,
        propiedades: propertyRows.length,
        pagos: paymentRows.length
      });
      console.log('👥 Datos de inquilinos:', tenantRows);
      console.log('🏠 Datos de propiedades:', propertyRows);
      console.log('💰 Datos de pagos:', paymentRows);

      let results = [];

      // Importar inquilinos
      if (tenantRows.length > 0) {
        try {
          const count = await importTenants(tenantRows);
          results.push(`${count} inquilinos`);
          console.log(`✅ Importados ${count} inquilinos exitosamente`);
        } catch (error: any) {
          console.error('❌ Error importando inquilinos:', error);
          const errorMsg = error.message || 'Error desconocido';
          toast.error(`Error con inquilinos: ${errorMsg}`);
          // No detener el proceso, continuar con otros tipos
        }
      }

      // Importar propiedades
      if (propertyRows.length > 0) {
        try {
          const count = await importProperties(propertyRows);
          results.push(`${count} propiedades`);
          console.log(`✅ Importadas ${count} propiedades exitosamente`);
        } catch (error: any) {
          console.error('❌ Error importando propiedades:', error);
          const errorMsg = error.message || 'Error desconocido';
          toast.error(`Error con propiedades: ${errorMsg}`);
        }
      }

      // Importar pagos
      if (paymentRows.length > 0) {
        try {
          const count = await importPayments(paymentRows);
          results.push(`${count} pagos`);
          console.log(`✅ Importados ${count} pagos exitosamente`);
        } catch (error: any) {
          console.error('❌ Error importando pagos:', error);
          const errorMsg = error.message || 'Error desconocido';
          toast.error(`Error con pagos: ${errorMsg}`);
        }
      }

      // Mostrar resumen detallado
      if (results.length > 0) {
        toast.success(`✅ Importados: ${results.join(', ')}`);
        onImportComplete();
        onClose();
      } else {
        // Dar información específica sobre por qué no se importó nada
        const totalRows = tenantRows.length + propertyRows.length + paymentRows.length;
        if (totalRows === 0) {
          toast.error('❌ No se encontraron filas válidas. Verifica que:\n• Tengas la columna "tipo" con valores: inquilino, propiedad, pago\n• Los campos obligatorios estén completos');
        } else {
          toast.error('❌ No se pudo importar ningún dato. Revisa los errores en la consola.');
        }
      }

    } catch (error: any) {
      console.error('💥 Error general:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Datos - RentaFlux
          </DialogTitle>
          <DialogDescription>
            Importa inquilinos, propiedades y pagos desde un archivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plantilla */}
          <div>
            <h3 className="text-lg font-medium mb-3">1. Descargar Plantilla Universal</h3>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full flex items-center gap-2 h-auto py-3"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Plantilla Completa</div>
                <div className="text-xs text-muted-foreground">Todos los campos - Inquilinos, Propiedades y Pagos</div>
              </div>
              <Download className="h-4 w-4 ml-auto" />
            </Button>
          </div>

          {/* Upload */}
          <div>
            <h3 className="text-lg font-medium mb-3">2. Subir Archivo Completado</h3>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mb-2"
            />
            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">{selectedFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Instrucciones:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Descarga la plantilla universal con todos los campos</li>
              <li>• <strong>Campos obligatorios por tipo:</strong></li>
              <li>&nbsp;&nbsp;- Inquilinos: tipo="inquilino" + name + email</li>
              <li>&nbsp;&nbsp;- Propiedades: tipo="propiedad" + name</li>
              <li>&nbsp;&nbsp;- Pagos: tipo="pago" + tenant_email + amount</li>
              <li>• <strong>Campos opcionales:</strong> Puedes dejarlos vacíos sin problema</li>
              <li>• Usa la columna "tipo" para especificar qué estás importando</li>
              <li>• Guarda como CSV y súbelo aquí</li>
              <li>• Los datos aparecerán automáticamente en cada sección</li>
              <li>• Si omites campos obligatorios, te dirá exactamente cuáles faltan</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleFileUpload}
            disabled={!selectedFile || isUploading}
            className="gap-2"
          >
            {isUploading ? 'Importando...' : 'Importar Datos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}