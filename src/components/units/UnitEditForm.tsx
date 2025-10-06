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
      setFormData({
        unit_number: unit.unit_number,
        rent_amount: unit.rent_amount || 0,
        tenant_id: unit.tenant_id || "",
      });
      setErrors({});
      loadAvailableTenants();
    }
  }, [unit, isOpen]);

  const loadAvailableTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, email')
        .eq('is_active', true)
        .is('unit_id', null);

      if (error) throw error;
      setAvailableTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
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
    
    if (validateForm() && unit) {
      try {
        const updatedUnit: Unit = {
          ...unit,
          unit_number: formData.unit_number,
          rent_amount: formData.rent_amount,
          tenant_id: formData.tenant_id || null,
          is_available: !formData.tenant_id,
        };
        
        await onSave(updatedUnit);
        onClose();
        toast.success("Unidad actualizada correctamente");
      } catch (error) {
        console.error('Error saving unit:', error);
        toast.error("Error al actualizar la unidad");
      }
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
              <Label htmlFor="unit_number" className="text-sm">Número de Unidad</Label>
              <Input
                id="unit_number"
                name="unit_number"
                value={formData.unit_number}
                onChange={handleChange}
                placeholder="Ej: 101, A, 1A"
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
                      {tenant.name}
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