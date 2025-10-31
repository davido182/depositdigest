import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UniversalImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function UniversalImport({ isOpen, onClose, onImportComplete }: UniversalImportProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    const csvContent = `nombre,email,telefono
Juan Pérez,juan@email.com,555-0123
María García,maria@email.com,555-0124`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_simple.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plantilla simple descargada');
  };

  const parseCSV = (text: string): any[] => {
    // Removed console.log for security
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

      // Intentar importar como inquilinos con diferentes nombres de columna
      const tenants = data.map(row => {
        const tenant: any = {
          landlord_id: user.id,
          is_active: true
        };

        // Probar diferentes nombres de columna para nombre
        if (row.nombre) tenant.name = row.nombre;
        else if (row.name) tenant.name = row.name;
        else if (row.full_name) tenant.name = row.full_name;
        else tenant.name = 'Sin nombre';

        // Email
        if (row.email) tenant.email = row.email;
        
        // Teléfono
        if (row.telefono) tenant.phone = row.telefono;
        else if (row.phone) tenant.phone = row.phone;

        // Otros campos opcionales
        if (row.numero_unidad) tenant.property_name = row.numero_unidad;
        if (row.monto_alquiler) tenant.rent_amount = parseFloat(row.monto_alquiler) || 0;

        return tenant;
      });

      // Removed console.log for security

      // Intentar insertar
      const { data: result, error } = await supabase
        .from('tenants')
        .insert(tenants)
        .select();

      if (error) {
        console.error('❌ Error:', error);
        toast.error(`Error: ${error.message}`);
        return;
      }

      toast.success(`${result.length} registros importados exitosamente`);
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
            Importar Datos
          </DialogTitle>
          <DialogDescription>
            Importa datos desde un archivo CSV simple
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">1. Descargar Plantilla</h3>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full flex items-center gap-2"
            >
              Descargar Plantilla Simple
              <Download className="h-4 w-4 ml-auto" />
            </Button>
          </div>

          <div>
            <h3 className="font-medium mb-2">2. Subir Archivo</h3>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            {selectedFile && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <strong>Instrucciones:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Descarga la plantilla</li>
              <li>• Completa con tus datos</li>
              <li>• Guarda como CSV</li>
              <li>• Sube el archivo</li>
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
          >
            {isUploading ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
