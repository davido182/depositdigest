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
      // Solo cargar datos de inquilino
      setFormData({
        unit_number: unit.unit_number,
        rent_amount: unit.monthly_rent || unit.rent_amount || 0,
        tenant_id: unit.tenant_id || "",
      });
      setErrors({});
      loadAvailableTenants();
    }
  }, [isOpen, unit]);

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

  const checkRentDifference = async (tenantId: string, unitRent: number) => {
    try {
      // Obtener la renta actual del inquilino
      const { data: tenantData, error } = await supabase
        .from('tenants')
        .select('monthly_rent, first_name, last_name')
        .eq('id', tenantId)
        .single();

      if (error || !tenantData) {
        console.log('No se pudo obtener datos del inquilino');
        return;
      }

      const tenantRent = tenantData.monthly_rent || 0;
      const tenantName = `${tenantData.first_name} ${tenantData.last_name}`.trim();

      if (Math.abs(tenantRent - unitRent) > 0.01) { // Diferencia mayor a 1 centavo
        const confirmed = confirm(
          `⚠️ DIFERENCIA DE RENTA DETECTADA\n\n` +
          `Inquilino: ${tenantName}\n` +
          `Renta en perfil del inquilino: €${tenantRent}\n` +
          `Renta de la unidad: €${unitRent}\n\n` +
          `¿Deseas actualizar la renta del inquilino a €${unitRent}?`
        );

        if (confirmed) {
          // Actualizar la renta del inquilino
          await supabase
            .from('tenants')
            .update({ monthly_rent: unitRent })
            .eq('id', tenantId);
          
          toast.success(`Renta del inquilino actualizada a €${unitRent}`);
        }
      }
    } catch (error) {
      console.error('Error checking rent difference:', error);
    }
  };

  const validateForm = () => {
    // No validation needed for tenant assignment
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unit) {
      console.log('No unit provided');
      return;
    }

    try {
      console.log('🔄 Assigning tenant to unit:', formData.tenant_id);
      
      // Solo actualizar la asignación de inquilino
      const updatedUnit: Unit = {
        ...unit,
        tenant_id: formData.tenant_id || null,
        is_available: !formData.tenant_id,
      };
      
      console.log('🔄 Updated unit object:', updatedUnit);
      
      // Verificar si hay diferencia de renta con el inquilino
      if (formData.tenant_id) {
        await checkRentDifference(formData.tenant_id, unit.monthly_rent || 0);
      }
      
      // Call the onSave function and wait for it
      await onSave(updatedUnit);
      
      console.log('✅ Unit assignment saved successfully');
      
      // Close the form and show success message
      onClose();
      toast.success("Inquilino asignado correctamente");
    } catch (error) {
      console.error('❌ Error assigning tenant:', error);
      toast.error(`Error al asignar inquilino: ${error.message || error}`);
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
            {/* Información de la unidad (solo lectura) */}
            <div className="space-y-1">
              <Label className="text-sm">Unidad</Label>
              <div className="p-2 bg-muted rounded-md">
                <span className="font-medium">{unit?.unit_number}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  €{unit?.monthly_rent || 0}/mes
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Para cambiar nombre o renta, edita la propiedad
              </p>
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