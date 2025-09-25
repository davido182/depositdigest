import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, Users, Building, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function DataImportModal({ isOpen, onClose, onImportComplete }: DataImportModalProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const downloadTemplate = (type: 'tenants' | 'properties' | 'payments') => {
    const templates = {
      tenants: {
        filename: 'plantilla_inquilinos.csv',
        headers: 'nombre,email,telefono,numero_unidad,fecha_inicio_contrato,fecha_fin_contrato,monto_alquiler,deposito,estado,notas',
        example: 'Juan Pérez,juan@email.com,555-0123,101,2024-01-01,2024-12-31,1200,2400,active,Inquilino puntual'
      },
      properties: {
        filename: 'plantilla_propiedades.csv',
        headers: 'nombre,direccion,descripcion,total_unidades',
        example: 'Edificio Central,Calle Principal 123,Edificio residencial moderno,10'
      },
      payments: {
        filename: 'plantilla_pagos.csv',
        headers: 'email_inquilino,monto,fecha_pago,metodo_pago,estado,notas',
        example: 'juan@email.com,1200,2024-01-01,transferencia,completed,Pago enero'
      }
    };

    const template = templates[type];
    const csvContent = `${template.headers}\n${template.example}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', template.filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Plantilla ${type} descargada`);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const importTenants = async (data: any[]) => {
    const tenants = data.map(row => ({
      name: row.nombre,
      email: row.email,
      phone: row.telefono || null,
      unit_number: row.numero_unidad,
      lease_start_date: row.fecha_inicio_contrato,
      lease_end_date: row.fecha_fin_contrato || null,
      rent_amount: parseFloat(row.monto_alquiler) || 0,
      deposit_amount: parseFloat(row.deposito) || 0,
      status: row.estado || 'active',
      notes: row.notas || null,
      user_id: user?.id
    }));

    const { data: result, error } = await supabase
      .from('tenants')
      .insert(tenants)
      .select();

    if (error) throw error;
    return result;
  };

  const importProperties = async (data: any[]) => {
    const properties = data.map(row => ({
      name: row.nombre,
      address: row.direccion || null,
      description: row.descripcion || null,
      total_units: parseInt(row.total_unidades) || 1,
      user_id: user?.id
    }));

    const { data: result, error } = await supabase
      .from('properties')
      .insert(properties)
      .select();

    if (error) throw error;
    return result;
  };

  const importPayments = async (data: any[]) => {
    // Primero obtener inquilinos para mapear emails a IDs
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, email')
      .eq('user_id', user?.id);

    if (tenantsError) throw tenantsError;

    const tenantMap = new Map(tenants?.map(t => [t.email, t.id]) || []);

    const payments = data
      .filter(row => tenantMap.has(row.email_inquilino))
      .map(row => ({
        tenant_id: tenantMap.get(row.email_inquilino),
        amount: parseFloat(row.monto) || 0,
        payment_date: row.fecha_pago,
        payment_method: row.metodo_pago || 'cash',
        status: row.estado || 'completed',
        notes: row.notas || null,
        user_id: user?.id
      }));

    const { data: result, error } = await supabase
      .from('payments')
      .insert(payments)
      .select();

    if (error) throw error;
    return result;
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        toast.error('El archivo está vacío o tiene formato incorrecto');
        return;
      }

      let result;
      const filename = selectedFile.name.toLowerCase();
      
      if (filename.includes('inquilino') || filename.includes('tenant')) {
        result = await importTenants(data);
        toast.success(`${result.length} inquilinos importados exitosamente`);
      } else if (filename.includes('propiedad') || filename.includes('property')) {
        result = await importProperties(data);
        toast.success(`${result.length} propiedades importadas exitosamente`);
      } else if (filename.includes('pago') || filename.includes('payment')) {
        result = await importPayments(data);
        toast.success(`${result.length} pagos importados exitosamente`);
      } else {
        toast.error('No se pudo determinar el tipo de archivo. Usa nombres descriptivos.');
        return;
      }

      onImportComplete();
      onClose();
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Error al importar datos. Verifica el formato del archivo.');
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
            Importar Datos desde Excel/CSV
          </DialogTitle>
          <DialogDescription>
            Importa tus datos existentes de forma masiva usando archivos CSV o Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plantillas */}
          <div>
            <h3 className="text-lg font-medium mb-3">1. Descargar Plantillas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => downloadTemplate('tenants')}
                className="flex items-center gap-2 h-auto py-3"
              >
                <Users className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Inquilinos</div>
                  <div className="text-xs text-muted-foreground">Plantilla CSV</div>
                </div>
                <Download className="h-4 w-4 ml-auto" />
              </Button>

              <Button
                variant="outline"
                onClick={() => downloadTemplate('properties')}
                className="flex items-center gap-2 h-auto py-3"
              >
                <Building className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Propiedades</div>
                  <div className="text-xs text-muted-foreground">Plantilla CSV</div>
                </div>
                <Download className="h-4 w-4 ml-auto" />
              </Button>

              <Button
                variant="outline"
                onClick={() => downloadTemplate('payments')}
                className="flex items-center gap-2 h-auto py-3"
              >
                <CreditCard className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Pagos</div>
                  <div className="text-xs text-muted-foreground">Plantilla CSV</div>
                </div>
                <Download className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </div>

          {/* Upload */}
          <div>
            <h3 className="text-lg font-medium mb-3">2. Subir Archivo Completado</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="file-upload">Seleccionar archivo CSV</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>
              
              {selectedFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Instrucciones:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Descarga la plantilla correspondiente</li>
              <li>• Completa los datos en Excel o Google Sheets</li>
              <li>• Guarda como CSV (separado por comas)</li>
              <li>• Sube el archivo aquí</li>
              <li>• El sistema detectará automáticamente el tipo de datos</li>
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
                Importar Datos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}