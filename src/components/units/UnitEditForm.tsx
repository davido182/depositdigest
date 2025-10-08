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
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && unit) {
      console.log('🔄 UnitEditForm opened with unit:', unit);
      
      // Load tenants first, then set the selected tenant
      loadAvailableTenants().then(() => {
        // Find the tenant assigned to this unit
        findAssignedTenant(unit.id);
      });
    }
  }, [isOpen, unit]);

  const findAssignedTenant = async (unitId: string) => {
    try {
      console.log('🔍 Finding tenant assigned to unit:', unitId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find tenant with this unit_id
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, first_name, last_name')
        .eq('unit_id', unitId)
        .eq('landlord_id', user.id)
        .single();

      if (!error && tenant) {
        console.log('✅ Found assigned tenant:', tenant);
        setSelectedTenantId(tenant.id);
      } else {
        console.log('📭 No tenant assigned to this unit');
        setSelectedTenantId("");
      }
    } catch (error) {
      console.error('Error finding assigned tenant:', error);
      setSelectedTenantId("");
    }
  };

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

  const handleTenantChange = (value: string) => {
    setSelectedTenantId(value);
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
      setIsLoading(true);
      console.log('🔄 Assigning tenant to unit:', selectedTenantId);
      
      // Verificar si hay diferencia de renta con el inquilino ANTES de asignar
      if (selectedTenantId) {
        await checkRentDifference(selectedTenantId, unit.monthly_rent || 0);
      }
      
      // En lugar de actualizar la tabla units (que no tiene tenant_id aún),
      // actualizamos la tabla tenants para asignar/desasignar la unidad
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      if (selectedTenantId) {
        // Asignar inquilino a esta unidad
        console.log('🔄 Assigning tenant to unit via tenants table');
        const { error: assignError } = await supabase
          .from('tenants')
          .update({ unit_id: unit.id })
          .eq('id', selectedTenantId)
          .eq('landlord_id', user.id);

        if (assignError) {
          console.error('❌ Error assigning tenant:', assignError);
          throw assignError;
        }

        // Marcar unidad como ocupada
        const { error: unitError } = await supabase
          .from('units')
          .update({ is_available: false })
          .eq('id', unit.id);

        if (unitError) {
          console.error('❌ Error updating unit availability:', unitError);
          throw unitError;
        }
      } else {
        // Desasignar inquilino de esta unidad
        console.log('🔄 Unassigning tenant from unit');
        const { error: unassignError } = await supabase
          .from('tenants')
          .update({ unit_id: null })
          .eq('unit_id', unit.id)
          .eq('landlord_id', user.id);

        if (unassignError) {
          console.error('❌ Error unassigning tenant:', unassignError);
          throw unassignError;
        }

        // Marcar unidad como disponible
        const { error: unitError } = await supabase
          .from('units')
          .update({ is_available: true })
          .eq('id', unit.id);

        if (unitError) {
          console.error('❌ Error updating unit availability:', unitError);
          throw unitError;
        }
      }
      
      console.log('✅ Unit assignment saved successfully');
      
      // Close the form and show success message
      onClose();
      toast.success("Inquilino asignado correctamente");
      
      // Refresh parent component
      if (onSave) {
        const updatedUnit: Unit = {
          ...unit,
          is_available: !selectedTenantId,
        };
        onSave(updatedUnit);
      }
    } catch (error) {
      console.error('❌ Error assigning tenant:', error);
      toast.error(`Error al asignar inquilino: ${error.message || error}`);
    } finally {
      setIsLoading(false);
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
              <Select value={selectedTenantId} onValueChange={handleTenantChange}>
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
                <Badge variant={selectedTenantId ? "default" : "secondary"}>
                  {selectedTenantId ? "Ocupada" : "Disponible"}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm" disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}