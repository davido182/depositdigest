import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Unit {
  id: string;
  unit_number: string;
  rent_amount?: number | null;
  monthly_rent?: number | null;
  is_available: boolean;
  tenant_id?: string | null;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
}

interface UnitEditFormProps {
  unit: Unit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: Unit) => void;
}

export function UnitEditForm({ unit, isOpen, onClose, onSave }: UnitEditFormProps) {
  const [formData, setFormData] = useState({
    unit_number: "",
    rent_amount: 0,
    tenant_id: "",
  });
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && unit) {
      // Always use the latest unit data
      setFormData({
        unit_number: unit.unit_number,
        rent_amount: unit.monthly_rent || unit.rent_amount || 0, // Try monthly_rent first
        tenant_id: unit.tenant_id || "",
      });
      setErrors({});
      loadAvailableTenants();
    }
  }, [isOpen, unit]); // Keep unit dependency but handle it better

  const loadAvailableTenants = async () => {
    try {
      console.log('🔍 Loading tenants for unit assignment...');
      
      // Get current user to filter tenants
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No authenticated user');
        setAvailableTenants([]);
        return;
      }
      
      console.log('👤 Current user:', user.id);
      
      // Get all tenants for this user
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('landlord_id', user.id);

      if (error) {
        console.error('❌ Supabase error loading tenants:', error);
        setAvailableTenants([]);
        return;
      }
      
      console.log('📊 Raw tenants data from supabase:', data);
      
      // Map the data to our interface
      const mappedTenants = (data || []).map(tenant => ({
        id: tenant.id,
        name: `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || `Inquilino ${tenant.id.slice(0, 8)}`,
        email: tenant.email || 'Sin email'
      }));
      
      console.log('✅ Mapped tenants for selection:', mappedTenants);
      setAvailableTenants(mappedTenants);
      console.log(`🎯 Successfully loaded ${mappedTenants.length} tenants for unit assignment`);
    } catch (error) {
      console.error('💥 Error loading tenants:', error);
      setAvailableTenants([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "rent_amount") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleTenantChange = (value: string) => {
    setFormData(prev => ({ ...prev, tenant_id: value }));
    if (errors.tenant_id) {
      setErrors(prev => ({ ...prev, tenant_id: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.unit_number.trim()) {
      newErrors.unit_number = "El número de unidad es requerido";
    }
    
    if (formData.rent_amount < 0) {
      newErrors.rent_amount = "La renta debe ser mayor o igual a 0";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !unit) {
      console.log('Validation failed or no unit');
      return;
    }

    try {
      console.log('🔄 Saving unit with data:', formData);
      console.log('🔄 Original unit:', unit);
      
      const updatedUnit: Unit = {
        ...unit,
        unit_number: formData.unit_number,
        rent_amount: formData.rent_amount,
        monthly_rent: formData.rent_amount, // Ensure both fields are updated
        tenant_id: formData.tenant_id || null,
        is_available: !formData.tenant_id,
      };
      
      console.log('🔄 Updated unit object:', updatedUnit);
      
      // Call the onSave function and wait for it
      await onSave(updatedUnit);
      
      console.log('✅ Unit saved successfully');
      
      // Close the form and show success message
      onClose();
      toast.success("Unidad actualizada correctamente");
    } catch (error) {
      console.error('❌ Error saving unit:', error);
      toast.error(`Error al actualizar la unidad: ${error.message || error}`);
    }
  };

  if (!unit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Unidad</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-2">
            <div className="space-y-1">
              <Label htmlFor="unit_number" className="text-sm">Nombre/Número de Unidad</Label>
              <Input
                id="unit_number"
                name="unit_number"
                value={formData.unit_number}
                onChange={handleChange}
                placeholder="Ej: 101, Apartamento A, Suite Principal"
                className={`h-9 ${errors.unit_number ? "border-destructive" : ""}`}
              />
              {errors.unit_number && (
                <p className="text-xs text-destructive">{errors.unit_number}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="rent_amount" className="text-sm">Renta Mensual (€)</Label>
              <Input
                id="rent_amount"
                name="rent_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.rent_amount}
                onChange={handleChange}
                placeholder="0.00"
                className={`h-9 ${errors.rent_amount ? "border-destructive" : ""}`}
              />
              {errors.rent_amount && (
                <p className="text-xs text-destructive">{errors.rent_amount}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Inquilino Asignado</Label>
              <Select value={formData.tenant_id} onValueChange={handleTenantChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sin inquilino asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin inquilino</SelectItem>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{tenant.name}</span>
                        <span className="text-xs text-muted-foreground">{tenant.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={formData.tenant_id ? "default" : "secondary"}>
                  {formData.tenant_id ? "Ocupada" : "Disponible"}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancelar
            </Button>
            <Button type="submit" size="sm">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}