
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tenant, PaymentType, PaymentMethod, PaymentStatus } from "@/types";
import DatabaseService from "@/services/DatabaseService";
import { toast } from "sonner";

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Callback to refresh payments list
}

export function PaymentForm({ isOpen, onClose, onSave }: PaymentFormProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [tenantId, setTenantId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<PaymentType>("rent");
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [status, setStatus] = useState<PaymentStatus>("completed");
  const [notes, setNotes] = useState("");
  
  // Form validation
  const [errors, setErrors] = useState({
    tenantId: "",
    amount: "",
  });
  
  // Load tenants when form opens
  useEffect(() => {
    if (isOpen) {
      loadTenants();
    }
  }, [isOpen]);
  
  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const dbService = DatabaseService.getInstance();
      const loadedTenants = await dbService.getTenants();
      setTenants(loadedTenants);
      
      // Set default tenant if available
      if (loadedTenants.length > 0) {
        setTenantId(loadedTenants[0].id);
        
        // Pre-fill amount with rent amount of selected tenant
        setAmount(loadedTenants[0].rentAmount.toString());
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
      toast.error("Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      tenantId: "",
      amount: "",
    };
    
    if (!tenantId) {
      newErrors.tenantId = "Tenant is required";
      valid = false;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const dbService = DatabaseService.getInstance();
      
      const paymentData = {
        tenantId,
        amount: Number(amount),
        date: date.toISOString(),
        type,
        method,
        status,
        notes,
      };
      
      await dbService.createPayment(paymentData);
      
      toast.success("Payment recorded successfully");
      resetForm();
      onSave(); // Notify parent to refresh payments list
      onClose(); // Close the dialog
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setTenantId(tenants.length > 0 ? tenants[0].id : "");
    setAmount("");
    setDate(new Date());
    setType("rent");
    setMethod("transfer");
    setStatus("completed");
    setNotes("");
    setErrors({ tenantId: "", amount: "" });
  };
  
  // Handle tenant change and update amount to match rent amount
  const handleTenantChange = (newTenantId: string) => {
    setTenantId(newTenantId);
    
    if (type === "rent") {
      // Find tenant and set amount to rent amount
      const selectedTenant = tenants.find(t => t.id === newTenantId);
      if (selectedTenant) {
        setAmount(selectedTenant.rentAmount.toString());
      }
    }
  };
  
  // Handle payment type change
  const handleTypeChange = (newType: PaymentType) => {
    setType(newType);
    
    // If changing to rent, update amount to match selected tenant's rent
    if (newType === "rent" && tenantId) {
      const selectedTenant = tenants.find(t => t.id === tenantId);
      if (selectedTenant) {
        setAmount(selectedTenant.rentAmount.toString());
      }
    } else if (newType === "deposit" && tenantId) {
      // For deposit, use security deposit amount if available
      const selectedTenant = tenants.find(t => t.id === tenantId);
      if (selectedTenant && selectedTenant.depositAmount) {
        setAmount(selectedTenant.depositAmount.toString());
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
          <DialogDescription>
            Record a new payment from a tenant.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tenant Selection */}
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant</Label>
            <Select
              value={tenantId}
              onValueChange={handleTenantChange}
              disabled={isLoading || tenants.length === 0}
            >
              <SelectTrigger id="tenant" className={errors.tenantId ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a tenant" />
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

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-8 ${errors.amount ? "border-destructive" : ""}`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  id="date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Payment Type</Label>
            <Select value={type} onValueChange={(value) => handleTypeChange(value as PaymentType)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="deposit">Security Deposit</SelectItem>
                <SelectItem value="fee">Fee</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger id="method">
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

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || isLoading}>
              {submitting ? "Saving..." : "Save Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
