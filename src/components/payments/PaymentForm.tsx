
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
    console.log('PaymentForm: Starting submit with formData:', formData);
    
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
            console.error('Receipt upload error:', uploadError);
            throw new Error('Error al subir el comprobante');
          }
          
          receiptPath = filePath;
          console.log('Receipt uploaded successfully:', receiptPath);
        }
        
        // Get current user for user_id
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser.user) {
          throw new Error('Usuario no autenticado');
        }

        // Create payment data with correct structure for database
        const paymentToSave = {
          // Map frontend fields to database fields
          tenant_id: formData.tenantId,
          amount: formData.amount,
          payment_date: formData.date,
          payment_method: formData.method,
          status: formData.status,
          notes: formData.notes || null,
          user_id: authUser.user.id,
          ...(receiptPath && { receipt_file_path: receiptPath }),
          // Include ID only for updates
          ...(payment && { id: payment.id })
        };
        
        console.log('PaymentForm: Mapped payment data for save:', paymentToSave);
        
        // Update payment tracking if month/year selected
        if (formData.month && formData.year && selectedTenant) {
          await supabase.from('payment_receipts').upsert({
            user_id: authUser.user.id,
            tenant_id: selectedTenant.id,
            year: formData.year,
            month: formData.month,
            has_receipt: !!receiptPath,
            receipt_file_path: receiptPath
          });
          console.log('PaymentForm: Payment receipt tracking updated');
        }
        
        // Convert back to frontend format for onSave callback
        const frontendPayment: Payment = {
          id: payment?.id || '',
          tenantId: formData.tenantId,
          amount: formData.amount,
          date: formData.date,
          type: formData.type,
          method: formData.method,
          status: formData.status,
          notes: formData.notes,
          createdAt: payment?.createdAt || new Date().toISOString(),
          ...(formData.month && { month: formData.month }),
          ...(formData.year && { year: formData.year }),
          ...(receiptPath && { receipt_file_path: receiptPath })
        };
        
        console.log('PaymentForm: Calling onSave with:', frontendPayment);
        onSave(frontendPayment);
        onClose();
        toast.success('Pago guardado exitosamente');
      } catch (error) {
        console.error('Error saving payment:', error);
        toast.error(`Error al guardar el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Año del Pago</Label>
                <Select value={formData.year?.toString() || ""} onValueChange={(year) => setFormData({...formData, year: parseInt(year)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona año" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="month">Mes del Pago</Label>
                <Select value={formData.month?.toString() || ""} onValueChange={(month) => setFormData({...formData, month: parseInt(month)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i, 1).toLocaleDateString('es-ES', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
