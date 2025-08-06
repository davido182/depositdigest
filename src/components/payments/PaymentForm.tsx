
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Payment, PaymentMethod, PaymentStatus, PaymentType, Tenant } from "@/types";
import { DollarSign, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { ValidationService } from "@/services/ValidationService";
import { sanitizeInput } from "@/utils/validation";
import { supabase } from "@/integrations/supabase/client";

interface PaymentFormProps {
  payment: Payment | null;
  tenants: Tenant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

export function PaymentForm({
  payment,
  tenants,
  isOpen,
  onClose,
  onSave,
}: PaymentFormProps) {
  const emptyPayment: Omit<Payment, 'id' | 'createdAt'> = {
    tenantId: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    type: "rent",
    method: "transfer",
    status: "completed",
    notes: "",
  };

  const [formData, setFormData] = useState<Omit<Payment, 'id' | 'createdAt'>>(
    payment || emptyPayment
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (payment) {
        setFormData(payment);
        const tenant = tenants.find(t => t.id === payment.tenantId);
        setSelectedTenant(tenant || null);
      } else {
        setFormData(emptyPayment);
        setSelectedTenant(null);
      }
      setErrors({});
    }
  }, [payment, isOpen, tenants]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === "amount") {
      const numValue = parseFloat(value) || 0;
      setFormData({ ...formData, [name]: numValue });
    } else if (name === "notes") {
      setFormData({ ...formData, [name]: sanitizeInput(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    setSelectedTenant(tenant || null);
    
    // Auto-fill rent amount for rent payments
    if (tenant && formData.type === "rent") {
      setFormData({
        ...formData,
        tenantId,
        amount: tenant.rentAmount,
      });
    } else {
      setFormData({
        ...formData,
        tenantId,
      });
    }
    
    // Clear tenant error
    if (errors.tenantId) {
      setErrors(prev => ({ ...prev, tenantId: '' }));
    }
  };

  const handleTypeChange = (type: PaymentType) => {
    // Auto-fill amount based on type and selected tenant
    let newAmount = formData.amount;
    if (selectedTenant) {
      if (type === "rent") {
        newAmount = selectedTenant.rentAmount;
      } else if (type === "deposit") {
        newAmount = selectedTenant.depositAmount;
      }
    }
    
    setFormData({
      ...formData,
      type,
      amount: newAmount,
    });
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setFormData({ ...formData, method });
  };

  const handleStatusChange = (status: PaymentStatus) => {
    setFormData({ ...formData, status });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    try {
      const validationService = ValidationService.getInstance();
      validationService.validatePayment(formData, tenants);
      return true;
    } catch (error: any) {
      if (error.message.includes('tenant')) {
        newErrors.tenantId = error.message;
      } else if (error.message.includes('amount')) {
        newErrors.amount = error.message;
      } else if (error.message.includes('date')) {
        newErrors.date = error.message;
      } else {
        toast.error(error.message);
      }
      
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        let receiptPath = null;
        
        // Upload receipt if provided
        if (receiptFile) {
          const fileExt = receiptFile.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `receipts/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('lease-contracts')
            .upload(filePath, receiptFile);
            
          if (uploadError) {
            throw new Error('Error al subir el comprobante');
          }
          
          receiptPath = filePath;
        }
        
        const paymentData: Payment = {
          ...formData,
          id: payment?.id || crypto.randomUUID(),
          createdAt: payment?.createdAt || new Date().toISOString(),
        };
        
        // Update payment tracking if month selected and receipt uploaded
        if (selectedMonth && receiptPath && selectedTenant) {
          const [year, month] = selectedMonth.split('-');
          await supabase.from('payment_receipts').upsert({
            user_id: selectedTenant.landlordId,
            tenant_id: selectedTenant.id,
            year: parseInt(year),
            month: parseInt(month),
            has_receipt: true,
            receipt_file_path: receiptPath
          });
        }
        
        onSave(paymentData);
      } catch (error) {
        console.error('Error saving payment:', error);
        toast.error('Error al guardar el pago');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {payment ? "Editar Pago" : "Registrar Nuevo Pago"}
          </DialogTitle>
          <DialogDescription>
            {payment
              ? "Actualiza la información del pago a continuación."
              : "Ingresa los detalles del pago a continuación."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tenantId" className="flex items-center gap-1">
                Inquilino <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.tenantId} onValueChange={handleTenantChange}>
                <SelectTrigger className={errors.tenantId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecciona un inquilino" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} - Unidad {tenant.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenantId && (
                <p className="text-xs text-destructive">{errors.tenantId}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de Pago</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Renta</SelectItem>
                    <SelectItem value="deposit">Depósito</SelectItem>
                    <SelectItem value="fee">Comisión</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount" className="flex items-center gap-1">
                  Cantidad <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center">
                  <span className="mr-2 text-muted-foreground">€</span>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    className={errors.amount ? "border-destructive" : ""}
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Fecha del Pago</Label>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={errors.date ? "border-destructive" : ""}
                />
              </div>
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="method">Método de Pago</Label>
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Select value={formData.method} onValueChange={handleMethodChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedTenant && formData.type === "rent" && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Renta esperada para {selectedTenant.name}: €{selectedTenant.rentAmount.toLocaleString()}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="month">Mes del Pago</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el mes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 12}, (_, i) => {
                    const date = new Date(2024, i, 1);
                    const monthKey = `2024-${String(i + 1).padStart(2, '0')}`;
                    return (
                      <SelectItem key={monthKey} value={monthKey}>
                        {date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receipt">Comprobante de Pago</Label>
              <Input
                id="receipt"
                name="receipt"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: PDF, JPG, PNG
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Agrega notas adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Pago</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
