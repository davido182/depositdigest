import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SimpleDataImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function SimpleDataImport({ isOpen, onClose, onImportComplete }: SimpleDataImportProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    const csvContent = `tipo,nombre,email,telefono,numero_unidad,monto_alquiler,direccion,descripcion,total_unidades,fecha_pago,metodo_pago,estado
inquilino,Juan Pérez,juan@email.com,555-0123,101,1200,,,,,,
inquilino,María García,maria@email.com,555-0124,102,1300,,,,,,
propiedad,Edificio Central,,,,,"Calle Principal 123","Edificio moderno",10,,,
pago,,juan@email.com,,,1200,,,,"2024-01-01",transferencia,completed`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_universal.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plantilla universal descargada');
  };

  const parseCSVSimple = (text: string): any[] => {
    // Removed console.log for security
    
    const lines = text.trim().split('\n');
    // Removed console.log for security
    
    if (lines.length < 2) {
      console.error('❌ Necesitas al menos 2 líneas');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    // Removed console.log for security
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      // Removed console.log for security
      
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    // Removed console.log for security
    return data;
  };

  const importData = async (data: any[]) => {
    // Removed console.log for security
    
    let tenantsCount = 0;
    let propertiesCount = 0;
    let paymentsCount = 0;
    
    // Separar datos por tipo
    const tenants = [];
    const properties = [];
    const payments = [];
    
    for (const row of data) {
      const tipo = row.tipo?.toLowerCase() || 'auto';
      
      if (tipo === 'inquilino' || (tipo === 'auto' && row.nombre && row.email)) {
        tenants.push({
          name: row.nombre || row.name || '',
          email: row.email || '',
          phone: row.telefono || row.phone || null,
          property_name: row.numero_unidad || row.unit_number || null,
          rent_amount: parseFloat(row.monto_alquiler || row.rent_amount || '0') || 0,
          status: row.estado || 'active',
          landlord_id: user?.id,
          is_active: true
        });
      } else if (tipo === 'propiedad' || (tipo === 'auto' && row.direccion)) {
        properties.push({
          name: row.nombre || row.name || 'Propiedad',
          address: row.direccion || row.address || '',
          description: row.descripcion || row.description || null,
          total_units: parseInt(row.total_unidades || row.total_units || '1') || 1,
          landlord_id: user?.id
        });
      } else if (tipo === 'pago' || (tipo === 'auto' && row.fecha_pago)) {
        // Para pagos, necesitamos encontrar el tenant_id por email
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('email', row.email)
          .single();
          
        if (tenant) {
          payments.push({
            tenant_id: tenant.id,
            amount: parseFloat(row.monto_alquiler || row.amount || '0') || 0,
            payment_date: row.fecha_pago || row.payment_date || new Date().toISOString().split('T')[0],
            payment_method: row.metodo_pago || row.payment_method || 'cash',
            status: row.estado || row.status || 'completed',
            user_id: user?.id
          });
        }
      }
    }
    
    // Importar inquilinos
    if (tenants.length > 0) {
      // Removed console.log for security
      const { data: tenantsResult, error: tenantsError } = await supabase
        .from('tenants')
        .insert(tenants)
        .select();
        
      if (tenantsError) {
        console.error('❌ Error importando inquilinos:', tenantsError);
        throw new Error(`Error importando inquilinos: ${tenantsError.message}`);
      }
      tenantsCount = tenantsResult?.length || 0;
    }
    
    // Importar propiedades
    if (properties.length > 0) {
      // Removed console.log for security
      const { data: propertiesResult, error: propertiesError } = await supabase
        .from('properties')
        .insert(properties)
        .select();
        
      if (propertiesError) {
        console.error('❌ Error importando propiedades:', propertiesError);
        throw new Error(`Error importando propiedades: ${propertiesError.message}`);
      }
      propertiesCount = propertiesResult?.length || 0;
    }
    
    // Importar pagos
    if (payments.length > 0) {
      // Removed console.log for security
      const { data: paymentsResult, error: paymentsError } = await supabase
        .from('payments')
        .insert(payments)
        .select();
        
      if (paymentsError) {
        console.error('❌ Error importando pagos:', paymentsError);
        throw new Error(`Error importando pagos: ${paymentsError.message}`);
      }
      paymentsCount = paymentsResult?.length || 0;
    }
    
    return { tenantsCount, propertiesCount, paymentsCount };
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Removed console.log for security
      
      const text = await selectedFile.text();
      // Removed console.log for security
      
      const data = parseCSVSimple(text);
      
      if (data.length === 0) {
        toast.error('No se encontraron datos válidos en el archivo');
        return;
      }

      const result = await importData(data);
      const messages = [];
      if (result.tenantsCount > 0) messages.push(`${result.tenantsCount} inquilinos`);
      if (result.propertiesCount > 0) messages.push(`${result.propertiesCount} propiedades`);
      if (result.paymentsCount > 0) messages.push(`${result.paymentsCount} pagos`);
      
      toast.success(`Importados: ${messages.join(', ')}`);
      
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('💥 Error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Inquilinos
          </DialogTitle>
          <DialogDescription>
            Importa tus inquilinos desde un archivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plantilla */}
          <div>
            <h3 className="font-medium mb-2">1. Descargar Plantilla</h3>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Descargar Plantilla CSV
              <Download className="h-4 w-4 ml-auto" />
            </Button>
          </div>

          {/* Upload */}
          <div>
            <h3 className="font-medium mb-2">2. Subir Archivo</h3>
            <div>
              <Label htmlFor="file-upload">Seleccionar archivo CSV</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>

            {selectedFile && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <strong>Archivo:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <strong>Instrucciones:</strong>
            <ul className="mt-1 space-y-1 text-blue-800">
              <li>• Descarga la plantilla</li>
              <li>• Completa con tus datos</li>
              <li>• Guarda como CSV</li>
              <li>• Sube el archivo aquí</li>
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
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
