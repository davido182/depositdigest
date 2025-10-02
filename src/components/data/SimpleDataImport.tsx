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
    const csvContent = `nombre,email,telefono,numero_unidad,monto_alquiler
Juan Pérez,juan@email.com,555-0123,101,1200
María García,maria@email.com,555-0124,102,1300`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_inquilinos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plantilla descargada');
  };

  const parseCSVSimple = (text: string): any[] => {
    console.log('📄 Texto completo:', text);
    
    const lines = text.trim().split('\n');
    console.log('📝 Líneas:', lines);
    
    if (lines.length < 2) {
      console.error('❌ Necesitas al menos 2 líneas');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    console.log('📋 Headers:', headers);
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      console.log(`📊 Línea ${i}:`, values);
      
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    console.log('✅ Datos finales:', data);
    return data;
  };

  const importTenants = async (data: any[]) => {
    console.log('👥 Importando inquilinos:', data);
    
    const tenants = data.map(row => ({
      name: row.nombre || row.name || '',
      email: row.email || '',
      phone: row.telefono || row.phone || null,
      unit_number: row.numero_unidad || row.unit_number || null,
      rent_amount: parseFloat(row.monto_alquiler || row.rent_amount || '0') || 0,
      status: 'active',
      user_id: user?.id
    }));

    console.log('📤 Enviando a Supabase:', tenants);

    const { data: result, error } = await supabase
      .from('tenants')
      .insert(tenants)
      .select();

    if (error) {
      console.error('❌ Error de Supabase:', error);
      throw error;
    }
    
    console.log('✅ Inquilinos creados:', result);
    return result;
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      console.log('📁 Archivo:', selectedFile.name, selectedFile.size, 'bytes');
      
      const text = await selectedFile.text();
      console.log('📄 Contenido:', text);
      
      const data = parseCSVSimple(text);
      
      if (data.length === 0) {
        toast.error('No se encontraron datos válidos en el archivo');
        return;
      }

      const result = await importTenants(data);
      toast.success(`${result.length} inquilinos importados exitosamente`);
      
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