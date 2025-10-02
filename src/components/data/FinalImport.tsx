import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet } from "lucide-react";
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
    // Plantilla completa con todos los campos necesarios
    const csvContent = `tipo,nombre,email,telefono,numero_unidad,monto_alquiler,fecha_inicio_contrato,fecha_fin_contrato,direccion,descripcion,total_unidades,fecha_pago,metodo_pago,estado,notas
inquilino,Juan Pérez,juan@email.com,555-0123,101,1200,2024-01-01,2024-12-31,,,,,,,Inquilino puntual
inquilino,María García,maria@email.com,555-0124,102,1300,2024-02-01,2024-12-31,,,,,,,Excelente inquilina
propiedad,Edificio Central,,,,,"Calle Principal 123","Edificio residencial moderno",10,,,,,
pago,,juan@email.com,,,1200,,,,,,"2024-01-01",transferencia,completed,Pago enero`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_rentaflux.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plantilla universal descargada');
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
    const tenants = tenantRows.map(row => ({
      // Usar nombres de columna exactos de la base de datos
      name: row.nombre || row.name || 'Sin nombre',
      email: row.email || '',
      phone: row.telefono || row.phone || null,
      unit: row.numero_unidad || row.unit || null,
      move_in_date: row.fecha_inicio_contrato || new Date().toISOString().split('T')[0],
      lease_end_date: row.fecha_fin_contrato || null,
      rent_amount: parseFloat(row.monto_alquiler || '0') || 0,
      status: row.estado || 'active',
      notes: row.notas || null,
      user_id: user?.id
    }));

    console.log('📤 Intentando insertar inquilinos con estructura:', tenants[0]);
    console.log('📊 Total inquilinos a insertar:', tenants.length);

    const { data, error } = await supabase
      .from('tenants')
      .insert(tenants)
      .select();

    if (error) {
      console.error('❌ Error insertando inquilinos:', error);
      
      // Mensaje de error específico
      if (error.message.includes('Could not find')) {
        const missingColumn = error.message.match(/'([^']+)'/)?.[1];
        throw new Error(`La columna '${missingColumn}' no existe en la tabla de inquilinos. Verifica la estructura de tu base de datos.`);
      }
      
      throw new Error(`Error en inquilinos: ${error.message}`);
    }
    
    console.log('✅ Inquilinos insertados exitosamente:', data?.length);
    return data?.length || 0;
  };

  const importProperties = async (propertyRows: any[]) => {
    const properties = propertyRows.map(row => ({
      name: row.nombre || 'Propiedad',
      address: row.direccion || null,
      description: row.descripcion || null,
      total_units: parseInt(row.total_unidades || '1') || 1,
      user_id: user?.id
    }));

    console.log('📤 Intentando insertar propiedades con estructura:', properties[0]);
    console.log('🏠 Total propiedades a insertar:', properties.length);

    const { data, error } = await supabase
      .from('properties')
      .insert(properties)
      .select();

    if (error) {
      console.error('❌ Error insertando propiedades:', error);
      
      // Mensaje de error específico
      if (error.message.includes('Could not find')) {
        const missingColumn = error.message.match(/'([^']+)'/)?.[1];
        throw new Error(`La columna '${missingColumn}' no existe en la tabla de propiedades. Verifica la estructura de tu base de datos.`);
      }
      
      throw new Error(`Error en propiedades: ${error.message}`);
    }
    
    console.log('✅ Propiedades insertadas exitosamente:', data?.length);
    return data?.length || 0;
  };

  const importPayments = async (paymentRows: any[]) => {
    let successCount = 0;
    let errors = [];
    
    console.log('💰 Procesando pagos:', paymentRows.length);
    
    for (const row of paymentRows) {
      try {
        // Buscar el tenant por email
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('email', row.email)
          .eq('user_id', user?.id)
          .single();

        if (tenantError || !tenant) {
          errors.push(`No se encontró inquilino con email: ${row.email}`);
          continue;
        }

        const { error } = await supabase
          .from('payments')
          .insert({
            tenant_id: tenant.id,
            amount: parseFloat(row.monto_alquiler || row.amount || '0') || 0,
            payment_date: row.fecha_pago || new Date().toISOString().split('T')[0],
            payment_method: row.metodo_pago || 'cash',
            status: row.estado || 'completed',
            notes: row.notas || null,
            user_id: user?.id
          });

        if (error) {
          console.error('❌ Error insertando pago:', error);
          if (error.message.includes('Could not find')) {
            const missingColumn = error.message.match(/'([^']+)'/)?.[1];
            errors.push(`La columna '${missingColumn}' no existe en la tabla de pagos`);
          } else {
            errors.push(`Error en pago para ${row.email}: ${error.message}`);
          }
        } else {
          successCount++;
        }
      } catch (error: any) {
        errors.push(`Error procesando pago para ${row.email}: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('⚠️ Errores en pagos:', errors);
      throw new Error(`Errores en pagos: ${errors.join(', ')}`);
    }
    
    console.log('✅ Pagos insertados exitosamente:', successCount);
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

      // Separar por tipo con validación de campos obligatorios
      const tenantRows = data.filter(row => {
        const isInquilino = row.tipo === 'inquilino' || (!row.tipo && row.nombre && row.email);
        const hasRequired = row.nombre && row.email;
        return isInquilino && hasRequired;
      });
      
      const propertyRows = data.filter(row => {
        const isPropiedad = row.tipo === 'propiedad' || (!row.tipo && row.direccion);
        const hasRequired = row.nombre;
        return isPropiedad && hasRequired;
      });
      
      const paymentRows = data.filter(row => {
        const isPago = row.tipo === 'pago' || (!row.tipo && row.fecha_pago);
        const hasRequired = row.email && (row.monto_alquiler || row.amount);
        return isPago && hasRequired;
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

      if (results.length > 0) {
        toast.success(`Importados: ${results.join(', ')}`);
        onImportComplete();
        onClose();
      } else {
        toast.error('No se pudo importar ningún dato');
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
              <div className="text-left">
                <div className="font-medium">Plantilla Completa</div>
                <div className="text-xs text-muted-foreground">Inquilinos, Propiedades y Pagos</div>
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
              <li>• Descarga la plantilla completa con todos los campos</li>
              <li>• <strong>Campos obligatorios:</strong> Inquilinos (nombre, email), Propiedades (nombre), Pagos (email, monto)</li>
              <li>• Usa la columna "tipo" para especificar: inquilino, propiedad, pago</li>
              <li>• Los campos opcionales pueden quedar vacíos</li>
              <li>• Guarda como CSV y súbelo aquí</li>
              <li>• Los datos aparecerán automáticamente en cada sección</li>
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