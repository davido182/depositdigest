
import React from "react";
import { useState, useEffect } from "react";
import { Tenant } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Calendar, DollarSign, Home, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import DatabaseService from "@/services/DatabaseService";

interface TenantEditFormProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
}

export function TenantEditForm({
  tenant,
  isOpen,
  onClose,
  onSave,
}: TenantEditFormProps) {
  const emptyTenant: Tenant = {
    id: "",
    name: "",
    email: "",
    phone: "",
    unit: "",
    moveInDate: new Date().toISOString().split("T")[0],
    leaseEndDate: new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    )
      .toISOString()
      .split("T")[0],
    rentAmount: 0,
    depositAmount: 0,
    status: "active",
    paymentHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<Tenant>(tenant || emptyTenant);
  const [hasDeposit, setHasDeposit] = useState(
    tenant ? tenant.depositAmount > 0 : false
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [totalUnits, setTotalUnits] = useState(20);

  useEffect(() => {
    if (isOpen) {
      setFormData(tenant || emptyTenant);
      setHasDeposit(tenant ? tenant.depositAmount > 0 : false);
      setErrors({});
      loadAvailableUnits();
    }
  }, [tenant, isOpen]);

  const loadAvailableUnits = async () => {
    try {
      const dbService = DatabaseService.getInstance();
      const tenants = await dbService.getTenants();
      const units = dbService.getTotalUnits();
      setTotalUnits(units);
      
      // Generate array of all possible units
      const allUnits = Array.from({ length: units }, (_, i) => (i + 1).toString());
      
      // Filter out units that are already occupied by active tenants
      // Exclude the current tenant's unit if editing
      const occupiedUnits = tenants
        .filter(t => t.status === 'active' && (tenant ? t.id !== tenant.id : true))
        .map(t => t.unit);
        
      const available = allUnits.filter(unit => !occupiedUnits.includes(unit));
      
      // If editing, add the current tenant's unit to available units
      if (tenant && tenant.unit) {
        if (!available.includes(tenant.unit)) {
          available.push(tenant.unit);
        }
      }
      
      setAvailableUnits(available.sort((a, b) => parseInt(a) - parseInt(b)));
    } catch (error) {
      console.error("Error loading available units:", error);
      toast.error("Failed to load available units");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "rentAmount" || name === "depositAmount") {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData({
      ...formData,
      status: value as Tenant["status"],
    });
  };
  
  const handleUnitChange = (value: string) => {
    setFormData({
      ...formData,
      unit: value,
    });
  };

  const handleDepositToggle = (checked: boolean) => {
    setHasDeposit(checked);
    if (!checked) {
      setFormData({
        ...formData,
        depositAmount: 0,
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (formData.rentAmount <= 0) {
      newErrors.rentAmount = "Rent amount must be greater than 0";
    }
    
    if (hasDeposit && formData.depositAmount <= 0) {
      newErrors.depositAmount = "Deposit amount must be greater than 0";
    }
    
    if (!formData.unit) {
      newErrors.unit = "Unit is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Update the tenant with the current timestamp
      const updatedTenant = {
        ...formData,
        updatedAt: new Date().toISOString(),
        // If it's a new tenant, generate an ID
        id: formData.id || `tenant-${Date.now()}`,
      };
      
      console.log("Submitting tenant data:", updatedTenant);
      onSave(updatedTenant);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tenant ? "Edit Tenant" : "Add New Tenant"}
          </DialogTitle>
          <DialogDescription>
            {tenant
              ? "Update the tenant information below."
              : "Enter the new tenant details below."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit" className="flex items-center gap-1">
                  Unit <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center">
                  <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Select 
                    value={formData.unit} 
                    onValueChange={handleUnitChange}
                  >
                    <SelectTrigger className={errors.unit ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.length > 0 ? (
                        availableUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>
                            Unit {unit}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No units available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {errors.unit && (
                  <p className="text-xs text-destructive">{errors.unit}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="moveInDate">Move In Date</Label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="moveInDate"
                    name="moveInDate"
                    type="date"
                    value={formData.moveInDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="leaseEndDate">Lease End Date</Label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="leaseEndDate"
                    name="leaseEndDate"
                    type="date"
                    value={formData.leaseEndDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rentAmount" className="flex items-center gap-1">
                Rent Amount <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                <Input
                  id="rentAmount"
                  name="rentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.rentAmount}
                  onChange={handleChange}
                  className={errors.rentAmount ? "border-destructive" : ""}
                />
              </div>
              {errors.rentAmount && (
                <p className="text-xs text-destructive">{errors.rentAmount}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hasDeposit"
                checked={hasDeposit}
                onCheckedChange={handleDepositToggle}
              />
              <Label htmlFor="hasDeposit">Has Security Deposit</Label>
            </div>

            {hasDeposit && (
              <div className="grid gap-2 ml-6">
                <Label
                  htmlFor="depositAmount"
                  className="flex items-center gap-1"
                >
                  Deposit Amount <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="depositAmount"
                    name="depositAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.depositAmount}
                    onChange={handleChange}
                    className={errors.depositAmount ? "border-destructive" : ""}
                  />
                </div>
                {errors.depositAmount && (
                  <p className="text-xs text-destructive">
                    {errors.depositAmount}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              ></textarea>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
