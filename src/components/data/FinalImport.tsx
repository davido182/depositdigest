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

  const downloadTemplate = (type: 'inquilinos' | 'propiedades' | 'pagos') => {
    let csvContent = '';
    let filename = '';

    if (type === 'inquilinos') {
      csvContent = `name,email,phone,unit_number,lease_start_date,lease_end_date,rent_amount,status,notes
Juan Pérez,juan@email.com,555-0123,101,2024-01-01,2024-12-31,1200,active,Inquilino puntual
María García,maria@email.com,555-0124,102,2024-02-01,2024-12-31,1300,active,Excelente inquilina`;
      filename = 'plantilla_inquilinos.csv';
    } else if (type === 'propiedades') {
      csvContent = `name,address,description,total_units
Edificio Central,"Calle Principal 123","Edificio residencial moderno",10
Casa Familiar,"Avenida Norte 456","Casa unifamiliar con jardín",1`;
      filename = 'plantilla_propiedades.csv';
    } else if (type === 'pagos') {
      csvContent = `tenant_email,amount,payment_date,payment_method,status,notes
juan@email.com,1200,2024-01-01,bank_transfer,completed,Pago enero
maria@email.com,1300,2024-01-01,cash,completed,Pago enero`;
      filename = 'plantilla_pagos.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Plantilla de ${type} descargada`);
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

    const tenants = tenantRows.map(row => {
      // Split name into first_name and last_name
      const fullName = row.name || 'Sin nombre';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Sin nombre';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        landlord_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: row.email || null,
        phone: row.phone || null,
        move_in_date: row.move_in_date || row.lease_start_date || null,
        move_out_date: row.move_out_date || row.lease_end_date || null,
        monthly_rent: parseFloat(row.monthly_rent || row.rent_amount || '0') || 0,
        deposit_paid: parseFloat(row.deposit_paid || row.deposit_amount || '0') || 0,
        is_active: (row.status || 'active') === 'active',
        notes: row.notes || null
        // unit_id: null // Por ahora sin unidad específica
      };
    });

    // Removed console.log for security

    const { data, error } = await supabase
      .from('tenants')
      .insert(tenants)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      throw new Error(`Error en inquilinos: ${error.message}`);
    }

    // Removed console.log for security
    return data?.length || 0;
  };

  const importProperties = async (propertyRows: any[]) => {
    if (!user) throw new Error('Usuario no autenticado');

    const properties = propertyRows.map(row => ({
      landlord_id: user.id,
      name: row.name || 'Propiedad',
      description: row.description || null,
      address: row.address || 'Dirección no especificada',
      city: row.city || 'Madrid',
      postal_code: row.postal_code || '28001',
      country: row.country || 'España',
      property_type: row.property_type || 'apartment',
      total_units: parseInt(row.total_units || '1') || 1,
      purchase_price: parseFloat(row.purchase_price || '0') || null,
      current_value: parseFloat(row.current_value || '0') || null,
      purchase_date: row.purchase_date || null,
      is_active: true
    }));

    // Removed console.log for security
    // Removed console.log for security);

    const { data, error } = await supabase
      .from('properties')
      .insert(properties)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      throw new Error(`Error en propiedades: ${error.message}`);
    }

    // Removed console.log for security
    return data?.length || 0;
  };

  const importPayments = async (paymentRows: any[]) => {

    let successCount = 0;

    // Removed console.log for security

    for (const row of paymentRows) {
      try {
        // Buscar el tenant por email SIN filtro user_id
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('email', row.tenant_email)
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
            notes: row.notes || null
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

    // Removed console.log for security
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

      // Removed console.log for security

      // Detectar automáticamente el tipo de archivo por sus columnas
      const headers = Object.keys(data[0] || {});
      // Removed console.log for security

      let tenantRows = [];
      let propertyRows = [];
      let paymentRows = [];

      // Detectar si es archivo de inquilinos
      if (headers.includes('name') && headers.includes('email') && !headers.includes('tenant_email')) {
        tenantRows = data.filter(row => row.name && row.email);
        // Removed console.log for security
      }

      // Detectar si es archivo de propiedades
      if (headers.includes('name') && headers.includes('address') && !headers.includes('email')) {
        propertyRows = data.filter(row => row.name);
        // Removed console.log for security
      }

      // Detectar si es archivo de pagos
      if (headers.includes('tenant_email') && headers.includes('amount')) {
        paymentRows = data.filter(row => row.tenant_email && row.amount);
        // Removed console.log for security
      }

      console.log('📋 Filas separadas:', {
        inquilinos: tenantRows.length,
        propiedades: propertyRows.length,
        pagos: paymentRows.length
      });
      // Removed console.log for security
      // Removed console.log for security
      // Removed console.log for security

      let results = [];

      // Importar inquilinos
      if (tenantRows.length > 0) {
        try {
          const count = await importTenants(tenantRows);
          results.push(`${count} inquilinos`);
          // Removed console.log for security
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
          // Removed console.log for security
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
          // Removed console.log for security
        } catch (error: any) {
          console.error('❌ Error importando pagos:', error);
          const errorMsg = error.message || 'Error desconocido';
          toast.error(`Error con pagos: ${errorMsg}`);
        }
      }

      // Mostrar resumen detallado
      if (results.length > 0) {
        toast.success(`✅ Importados: ${results.join(', ')}`);

        // Mostrar mensaje adicional y recargar
        setTimeout(() => {
          toast.info('🔄 Recargando página para mostrar los datos...');
          window.location.reload();
        }, 2000);

        onImportComplete();
        onClose();
      } else {
        // Dar información específica sobre por qué no se importó nada
        const totalRows = tenantRows.length + propertyRows.length + paymentRows.length;
        console.log('🔍 Debug info:', {
          totalRows,
          tenantRows: tenantRows.length,
          propertyRows: propertyRows.length,
          paymentRows: paymentRows.length,
          sampleData: data.slice(0, 2)
        });

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
            <h3 className="text-lg font-medium mb-3">1. Descargar Plantillas por Tipo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => downloadTemplate('inquilinos')}
                className="flex items-center gap-2 h-auto py-3"
              >
                <Users className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Inquilinos</div>
                  <div className="text-xs text-muted-foreground">Campos completos</div>
                </div>
                <Download className="h-4 w-4 ml-auto" />
              </Button>

              <Button
                variant="outline"
                onClick={() => downloadTemplate('propiedades')}
                className="flex items-center gap-2 h-auto py-3"
              >
                <Building className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Propiedades</div>
                  <div className="text-xs text-muted-foreground">Campos completos</div>
                </div>
                <Download className="h-4 w-4 ml-auto" />
              </Button>

              <Button
                variant="outline"
                onClick={() => downloadTemplate('pagos')}
                className="flex items-center gap-2 h-auto py-3"
              >
                <CreditCard className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Pagos</div>
                  <div className="text-xs text-muted-foreground">Campos completos</div>
                </div>
                <Download className="h-4 w-4 ml-auto" />
              </Button>
            </div>
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
              <li>• Descarga la plantilla del tipo que necesites</li>
              <li>• <strong>Campos obligatorios:</strong></li>
              <li>&nbsp;&nbsp;- Inquilinos: name + email</li>
              <li>&nbsp;&nbsp;- Propiedades: name</li>
              <li>&nbsp;&nbsp;- Pagos: tenant_email + amount</li>
              <li>• <strong>Campos opcionales:</strong> Puedes dejarlos vacíos sin problema</li>
              <li>• Completa los datos y guarda como CSV</li>
              <li>• Los datos aparecerán automáticamente en la sección correspondiente</li>
              <li>• Si hay errores, el mensaje te dirá exactamente qué está mal</li>
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
