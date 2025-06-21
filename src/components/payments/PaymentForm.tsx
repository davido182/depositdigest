
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const paymentData: Payment = {
        ...formData,
        id: payment?.id || crypto.randomUUID(),
        createdAt: payment?.createdAt || new Date().toISOString(),
      };
      
      onSave(paymentData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {payment ? "Edit Payment" : "Record New Payment"}
          </DialogTitle>
          <DialogDescription>
            {payment
              ? "Update the payment information below."
              : "Enter the payment details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tenantId" className="flex items-center gap-1">
                Tenant <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.tenantId} onValueChange={handleTenantChange}>
                <SelectTrigger className={errors.tenantId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} - Unit {tenant.unit}
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
                <Label htmlFor="type">Payment Type</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount" className="flex items-center gap-1">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
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
              <Label htmlFor="date">Payment Date</Label>
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
                <Label htmlFor="method">Payment Method</Label>
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Select value={formData.method} onValueChange={handleMethodChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedTenant && formData.type === "rent" && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Expected rent for {selectedTenant.name}: ${selectedTenant.rentAmount.toLocaleString()}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
