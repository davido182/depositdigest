
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Check, X, Download } from "lucide-react";
import { toast } from "sonner";
import { Tenant, Payment } from "@/types";

interface ExtractedData {
  amount?: number;
  date?: string;
  description?: string;
  reference?: string;
  fileName?: string;
}

interface ReceiptProcessorProps {
  tenants: Tenant[];
  onPaymentCreated: (payment: Payment) => void;
}

export function ReceiptProcessor({ tenants, onPaymentCreated }: ReceiptProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedReceipts, setProcessedReceipts] = useState<Array<{id: string, fileName: string, date: string, amount: number}>>([]);
  const [verificationData, setVerificationData] = useState({
    tenantId: '',
    amount: '',
    date: '',
    month: '',
    description: 'rent'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name, 'Tipo:', file.type, 'Tamaño:', file.size);
      setSelectedFile(file);
      processReceipt(file);
    }
  };

  const processReceipt = async (file: File) => {
    setIsProcessing(true);
    console.log('Iniciando procesamiento del comprobante:', file.name);
    
    try {
      // Simular procesamiento OCR mejorado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Datos simulados más realistas basados en el nombre del archivo
      const fileName = file.name.toLowerCase();
      let amount = 800; // Default amount
      
      // Intentar extraer monto del nombre del archivo
      const amountMatch = fileName.match(/(\d+(?:\.\d{2})?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1]);
      }
      
      // Intentar extraer fecha del nombre del archivo
      let extractedDate = new Date().toISOString().split('T')[0];
      const dateMatch = fileName.match(/(\d{4}[-_]\d{2}[-_]\d{2})|(\d{2}[-_]\d{2}[-_]\d{4})/);
      if (dateMatch) {
        const dateStr = dateMatch[0].replace(/_/g, '-');
        try {
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            extractedDate = parsedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          console.log('Could not parse date from filename');
        }
      }
      
      const mockExtractedData: ExtractedData = {
        amount: amount,
        date: extractedDate,
        description: `Pago de renta - ${file.name}`,
        reference: `REF${Date.now()}`,
        fileName: file.name
      };
      
      console.log('Datos extraídos:', mockExtractedData);
      
      setExtractedData(mockExtractedData);
      setVerificationData(prev => ({
        ...prev,
        amount: mockExtractedData.amount?.toString() || '',
        date: mockExtractedData.date || ''
      }));
      
      toast.success(`Comprobante "${file.name}" procesado exitosamente`);
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error("Error al procesar el comprobante");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = () => {
    if (!verificationData.tenantId || !verificationData.amount || !verificationData.date) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const selectedTenant = tenants.find(t => t.id === verificationData.tenantId);
    if (!selectedTenant) {
      toast.error("Inquilino no encontrado");
      return;
    }

    console.log('Creando pago para inquilino:', selectedTenant.name);

    const paymentId = `payment-${Date.now()}`;
    const newPayment: Payment = {
      id: paymentId,
      tenantId: verificationData.tenantId,
      amount: parseFloat(verificationData.amount),
      date: verificationData.date,
      type: verificationData.description as Payment['type'],
      method: 'transfer',
      status: 'completed',
      notes: `Procesado desde comprobante: ${extractedData?.fileName || 'archivo'}. ${verificationData.month ? `Mes: ${verificationData.month}` : ''}${extractedData?.reference ? ` Referencia: ${extractedData.reference}` : ''}`,
      createdAt: new Date().toISOString()
    };

    // Guardar referencia del comprobante procesado
    const receiptRecord = {
      id: paymentId,
      fileName: extractedData?.fileName || selectedFile?.name || 'archivo',
      date: verificationData.date,
      amount: parseFloat(verificationData.amount)
    };
    
    setProcessedReceipts(prev => [...prev, receiptRecord]);
    
    onPaymentCreated(newPayment);
    
    // Limpiar formulario
    handleReject();
    
    toast.success(`Pago de $${verificationData.amount} registrado para ${selectedTenant.name}`);
  };

  const handleReject = () => {
    setExtractedData(null);
    setSelectedFile(null);
    setVerificationData({
      tenantId: '',
      amount: '',
      date: '',
      month: '',
      description: 'rent'
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadReceipt = (receiptId: string) => {
    const receipt = processedReceipts.find(r => r.id === receiptId);
    if (receipt) {
      // Crear un archivo de texto con la información del comprobante
      const content = `Comprobante Procesado
Archivo: ${receipt.fileName}
Fecha: ${receipt.date}
Monto: $${receipt.amount.toLocaleString()}
Procesado: ${new Date().toLocaleString()}`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante-${receiptId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Comprobante descargado');
    }
  };

  // Filtrar inquilinos activos para mostrar en el selector
  const activeTenantsForSelector = tenants.filter(tenant => tenant.status === 'active');
  
  console.log('Inquilinos disponibles para selector:', activeTenantsForSelector.length);
  console.log('Lista de inquilinos:', activeTenantsForSelector.map(t => ({ id: t.id, name: t.name, unit: t.unit })));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Procesador de Comprobantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedFile && (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mb-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Comprobante
              </Button>
              <p className="text-sm text-muted-foreground">
                Sube una imagen o PDF del comprobante de depósito
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">
                Procesando comprobante "{selectedFile?.name}"...
              </p>
            </div>
          )}

          {extractedData && !isProcessing && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Datos Extraídos del Comprobante:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Archivo:</strong> {extractedData.fileName}</p>
                  <p><strong>Cantidad:</strong> ${extractedData.amount?.toLocaleString()}</p>
                  <p><strong>Fecha:</strong> {extractedData.date}</p>
                  <p><strong>Descripción:</strong> {extractedData.description}</p>
                  {extractedData.reference && (
                    <p><strong>Referencia:</strong> {extractedData.reference}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-select">Inquilino *</Label>
                  <Select
                    value={verificationData.tenantId}
                    onValueChange={(value) => setVerificationData(prev => ({ ...prev, tenantId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        activeTenantsForSelector.length > 0 
                          ? "Seleccionar inquilino" 
                          : "No hay inquilinos activos disponibles"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTenantsForSelector.length > 0 ? (
                        activeTenantsForSelector.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} - Unidad {tenant.unit}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-tenants" disabled>
                          No hay inquilinos activos
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {activeTenantsForSelector.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nota: Solo se muestran inquilinos con estado "activo"
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount-input">Cantidad *</Label>
                  <Input
                    id="amount-input"
                    type="number"
                    step="0.01"
                    value={verificationData.amount}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-input">Fecha del Pago *</Label>
                  <Input
                    id="date-input"
                    type="date"
                    value={verificationData.date}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month-input">Mes Correspondiente</Label>
                  <Input
                    id="month-input"
                    type="text"
                    value={verificationData.month}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, month: e.target.value }))}
                    placeholder="Ej: Enero 2024"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description-select">Tipo de Pago</Label>
                  <Select
                    value={verificationData.description}
                    onValueChange={(value) => setVerificationData(prev => ({ ...prev, description: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Alquiler</SelectItem>
                      <SelectItem value="deposit">Depósito</SelectItem>
                      <SelectItem value="fee">Tarifa</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleConfirmPayment} 
                  className="flex-1"
                  disabled={!verificationData.tenantId || !verificationData.amount || !verificationData.date}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Pago
                </Button>
                <Button onClick={handleReject} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de comprobantes procesados */}
      {processedReceipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comprobantes Procesados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedReceipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{receipt.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {receipt.date} - ${receipt.amount.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReceipt(receipt.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
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
