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
    // Plantilla universal con todos los campos correctos
    const csvContent = `tipo,nombre,email,telefono,numero_unidad,monto_alquiler,deposito,fecha_inicio_contrato,fecha_fin_contrato,direccion,descripcion,total_unidades,fecha_pago,metodo_pago,estado,notas
inquilino,Juan Pérez,juan@email.com,555-0123,101,1200,2400,2024-01-01,2024-12-31,,,,,,,Inquilino puntual
inquilino,María García,maria@email.com,555-0124,102,1300,2600,2024-02-01,2024-12-31,,,,,,,Excelente inquilina
propiedad,Edificio Central,,,,,,,"Calle Principal 123","Edificio moderno",10,,,,,
pago,,juan@email.com,,,1200,,,,,,,"2024-01-01",transferencia,completed,Pago enero`;
    
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
      // Usar exactamente los nombres de columna de la base de datos
      name: row.nombre || row.name || 'Sin nombre',
      email: row.email || '',
      phone: row.telefono || row.phone || '',
      unit: row.numero_unidad || row.unit || '',
      move_in_date: row.fecha_inicio_contrato || new Date().toISOString().split('T')[0],
      lease_end_date: row.fecha_fin_contrato || null,
      rent_amount: parseFloat(row.monto_alquiler || '0') || 0,
      deposit_amount: parseFloat(row.deposito || '0') || 0,
      status: row.estado || 'active',
      notes: row.notas || null,
      user_id: user?.id
    }));

    console.log('📤 Intentando insertar inquilinos:', tenants);

    const { data, error } = await supabase
      .from('tenants')
      .insert(tenants)
      .select();

    if (error) {
      console.error('❌ Error insertando inquilinos:', error);
      throw error;
    }
    
    console.log('✅ Inquilinos insertados:', data);
    return data?.length || 0;
  };

  const importProperties = async (propertyRows: any[]) => {
    const properties = propertyRows.map(row => ({
      name: row.nombre || 'Propiedad',
      address: row.direccion || '',
      description: row.descripcion || null,
      total_units: parseInt(row.total_unidades || '1') || 1,
      user_id: user?.id
    }));

    const { data, error } = await supabase
      .from('properties')
      .insert(properties)
      .select();

    if (error) throw error;
    return data?.length || 0;
  };

  const importPayments = async (paymentRows: any[]) => {
    let successCount = 0;
    
    for (const row of paymentRows) {
      // Buscar el tenant por email
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('email', row.email)
        .eq('user_id', user?.id)
        .single();

      if (tenant) {
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

        if (!error) successCount++;
      }
    }
    
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

      // Separar por tipo
      const tenantRows = data.filter(row => 
        row.tipo === 'inquilino' || (!row.tipo && row.nombre && row.email)
      );
      const propertyRows = data.filter(row => 
        row.tipo === 'propiedad' || (!row.tipo && row.direccion)
      );
      const paymentRows = data.filter(row => 
        row.tipo === 'pago' || (!row.tipo && row.fecha_pago)
      );

      let results = [];

      // Importar inquilinos
      if (tenantRows.length > 0) {
        try {
          const count = await importTenants(tenantRows);
          results.push(`${count} inquilinos`);
        } catch (error: any) {
          console.error('Error importando inquilinos:', error);
          toast.error(`Error con inquilinos: ${error.message}`);
        }
      }

      // Importar propiedades
      if (propertyRows.length > 0) {
        try {
          const count = await importProperties(propertyRows);
          results.push(`${count} propiedades`);
        } catch (error: any) {
          console.error('Error importando propiedades:', error);
          toast.error(`Error con propiedades: ${error.message}`);
        }
      }

      // Importar pagos
      if (paymentRows.length > 0) {
        try {
          const count = await importPayments(paymentRows);
          results.push(`${count} pagos`);
        } catch (error: any) {
          console.error('Error importando pagos:', error);
          toast.error(`Error con pagos: ${error.message}`);
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
              <li>• Descarga la plantilla universal</li>
              <li>• Completa los datos (campos opcionales pueden quedar vacíos)</li>
              <li>• Usa la columna "tipo" para especificar: inquilino, propiedad, pago</li>
              <li>• Guarda como CSV y súbelo aquí</li>
              <li>• El sistema procesará automáticamente cada tipo de dato</li>
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