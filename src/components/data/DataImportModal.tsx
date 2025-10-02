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
        example: 'Juan Pérez,juan@email.com,555-0123,101,2024-01-01,2024-12-31,1200,2400,active,Inquilino puntual\nMaría García,maria@email.com,555-0124,102,2024-02-01,2024-12-31,1300,2600,active,Excelente inquilina'
      },
      properties: {
        filename: 'plantilla_propiedades.csv',
        headers: 'nombre,direccion,descripcion,total_unidades',
        example: 'Edificio Central,Calle Principal 123,Edificio residencial moderno,10\nCasa Familiar,Avenida Norte 456,Casa unifamiliar con jardín,1'
      },
      payments: {
        filename: 'plantilla_pagos.csv',
        headers: 'email_inquilino,monto,fecha_pago,metodo_pago,estado,notas',
        example: 'juan@email.com,1200,2024-01-01,transferencia,completed,Pago enero\nmaria@email.com,1300,2024-01-01,efectivo,completed,Pago enero'
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
    console.log('🔍 Iniciando parseo CSV...');

    // Limpiar el texto y dividir en líneas
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n').filter(line => line.trim());

    console.log('📝 Líneas encontradas:', lines.length);
    console.log('📝 Primera línea (headers):', lines[0]);
    console.log('📝 Segunda línea (datos):', lines[1]);

    if (lines.length < 1) {
      console.error('❌ No hay líneas en el archivo');
      return [];
    }

    // Función mejorada para parsear líneas CSV
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          // Manejar comillas dobles escapadas
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // Saltar la siguiente comilla
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      result.push(current.trim());
      return result.map(field => field.replace(/^"|"$/g, ''));
    };

    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    console.log('📋 Headers parseados:', headers);

    if (headers.length === 0) {
      console.error('❌ No se encontraron headers');
      return [];
    }

    const data = [];

    // Si solo hay headers, devolver array vacío
    if (lines.length < 2) {
      console.warn('⚠️ Solo hay headers, no hay datos');
      return [];
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Saltar líneas vacías

      const values = parseCSVLine(line);
      console.log(`📊 Línea ${i}:`, values);

      if (values.length > 0) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    console.log('✅ Parseo completado:', data.length, 'filas');
    return data;
  };

  const importTenants = async (data: any[]) => {
    console.log('👥 Importando inquilinos:', data);

    // Validar datos requeridos
    const validTenants = data.filter(row => {
      const hasName = row.nombre && row.nombre.trim();
      const hasEmail = row.email && row.email.trim();

      if (!hasName || !hasEmail) {
        console.warn('⚠️ Fila inválida (falta nombre o email):', row);
        return false;
      }
      return true;
    });

    if (validTenants.length === 0) {
      throw new Error('No se encontraron inquilinos válidos. Verifica que tengas columnas "nombre" y "email".');
    }

    const tenants = validTenants.map(row => ({
      name: row.nombre.trim(),
      email: row.email.trim(),
      phone: row.telefono?.trim() || null,
      unit_number: row.numero_unidad?.trim() || null,
      lease_start_date: row.fecha_inicio_contrato || null,
      lease_end_date: row.fecha_fin_contrato || null,
      rent_amount: parseFloat(row.monto_alquiler) || 0,
      deposit_amount: parseFloat(row.deposito) || 0,
      status: row.estado?.trim() || 'active',
      notes: row.notas?.trim() || null,
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
      console.log('📁 Archivo seleccionado:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      let text: string;

      // Manejar diferentes tipos de archivo
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        text = await selectedFile.text();
      } else if (selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls')) {
        // Para archivos Excel, el usuario debe convertir a CSV primero
        toast.error('Por favor, guarda tu archivo Excel como CSV antes de subirlo.');
        return;
      } else {
        // Intentar leer como texto de todos modos
        text = await selectedFile.text();
      }

      console.log('📄 Contenido del archivo (primeras 500 chars):', text.substring(0, 500));

      const data = parseCSV(text);

      console.log('📊 Datos parseados:', {
        totalRows: data.length,
        firstRow: data[0],
        headers: Object.keys(data[0] || {})
      });

      if (data.length === 0) {
        console.error('❌ No se pudieron parsear datos del archivo');
        toast.error('El archivo está vacío o tiene formato incorrecto. Verifica que:\n• El archivo sea CSV\n• Tenga al menos una fila de datos\n• Use comas como separador');
        return;
      }

      let result;
      const filename = selectedFile.name.toLowerCase();
      const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase());

      // Detectar tipo por headers o nombre de archivo
      const hasTenantHeaders = headers.some(h =>
        h.includes('nombre') || h.includes('email') || h.includes('telefono') ||
        h.includes('unidad') || h.includes('alquiler') || h.includes('name') || h.includes('phone')
      );

      const hasPropertyHeaders = headers.some(h =>
        h.includes('direccion') || h.includes('address') || h.includes('total_unidades') ||
        h.includes('descripcion') || h.includes('description')
      );

      const hasPaymentHeaders = headers.some(h =>
        h.includes('monto') || h.includes('amount') || h.includes('fecha_pago') ||
        h.includes('payment_date') || h.includes('metodo_pago') || h.includes('payment_method')
      );

      if (hasTenantHeaders || filename.includes('inquilino') || filename.includes('tenant')) {
        result = await importTenants(data);
        toast.success(`${result.length} inquilinos importados exitosamente`);
      } else if (hasPropertyHeaders || filename.includes('propiedad') || filename.includes('property')) {
        result = await importProperties(data);
        toast.success(`${result.length} propiedades importadas exitosamente`);
      } else if (hasPaymentHeaders || filename.includes('pago') || filename.includes('payment')) {
        result = await importPayments(data);
        toast.success(`${result.length} pagos importados exitosamente`);
      } else {
        // Si no se puede detectar, mostrar opciones al usuario
        const userChoice = window.confirm(
          `No se pudo detectar automáticamente el tipo de archivo.\n\n` +
          `¿Es un archivo de inquilinos? (OK = Sí, Cancelar = No)`
        );

        if (userChoice) {
          result = await importTenants(data);
          toast.success(`${result.length} inquilinos importados exitosamente`);
        } else {
          const isProperties = window.confirm(
            `¿Es un archivo de propiedades? (OK = Sí, Cancelar = Pagos)`
          );

          if (isProperties) {
            result = await importProperties(data);
            toast.success(`${result.length} propiedades importadas exitosamente`);
          } else {
            result = await importPayments(data);
            toast.success(`${result.length} pagos importados exitosamente`);
          }
        }
      }

      onImportComplete();
      onClose();
    } catch (error) {
      console.error('💥 Error importing data:', error);

      let errorMessage = 'Error al importar datos.';

      if (error instanceof Error) {
        errorMessage += ` Detalles: ${error.message}`;
      }

      // Agregar información específica del error
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as any;
        if (supabaseError.code === '23505') {
          errorMessage = 'Error: Ya existe un registro con esos datos.';
        } else if (supabaseError.code === '23503') {
          errorMessage = 'Error: Faltan datos requeridos o hay referencias inválidas.';
        }
      }

      toast.error(errorMessage);
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
                  <div className="text-xs text-muted-foreground">Con 2 ejemplos</div>
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
              <li>• <strong>IMPORTANTE:</strong> Guarda como CSV (separado por comas)</li>
              <li>• Usa nombres descriptivos (ej: "inquilinos.csv", "propiedades.csv")</li>
              <li>• Sube el archivo aquí</li>
              <li>• El sistema detectará automáticamente el tipo de datos</li>
            </ul>
          </div>

          {/* Debug info */}
          {selectedFile && (
            <div className="p-3 bg-gray-50 rounded-lg text-xs">
              <h4 className="font-medium mb-2">🔍 Información del archivo:</h4>
              <div className="space-y-1 text-gray-600">
                <div>Nombre: {selectedFile.name}</div>
                <div>Tamaño: {(selectedFile.size / 1024).toFixed(1)} KB</div>
                <div>Tipo: {selectedFile.type || 'No detectado'}</div>
                <div>Extensión: {selectedFile.name.split('.').pop()?.toUpperCase()}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          {/* Botón de prueba rápida */}
          <Button
            variant="secondary"
            onClick={() => {
              // Crear un archivo CSV de prueba
              const testCSV = 'nombre,email,telefono,numero_unidad,monto_alquiler\nJuan Test,juan.test@email.com,555-1234,101,1200\nMaría Test,maria.test@email.com,555-5678,102,1300';
              const blob = new Blob([testCSV], { type: 'text/csv' });
              const file = new File([blob], 'test_inquilinos.csv', { type: 'text/csv' });
              setSelectedFile(file);
              toast.success('Archivo de prueba cargado. Haz clic en "Importar Datos"');
            }}
            className="gap-2"
          >
            🧪 Prueba Rápida
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