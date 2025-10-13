import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Unit {
  id: string;
  unit_number: string;
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

      // Check if unit has tenant_id assigned
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('tenant_id')
        .eq('id', unitId)
        .single();

      if (!unitError && unitData?.tenant_id) {
        console.log('✅ Found assigned tenant ID:', unitData.tenant_id);
        setSelectedTenantId(unitData.tenant_id);
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

      // Map the data to our interface using correct field names
      const mappedTenants = (data || []).map(tenant => ({
        id: tenant.id,
        name: tenant.name || `Inquilino ${tenant.id.slice(0, 8)}`,
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
        .select('rent_amount, name')
        .eq('id', tenantId)
        .single();

      if (error || !tenantData) {
        console.log('No se pudo obtener datos del inquilino');
        return;
      }

      const tenantRent = tenantData.rent_amount || 0;
      const tenantName = tenantData.name;

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
            .update({ rent_amount: unitRent })
            .eq('id', tenantId);

          toast.success(`Renta del inquilino actualizada a €${unitRent}`);
        }
      }
    } catch (error) {
      console.error('Error checking rent difference:', error);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unit) {
      console.log('No unit provided');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Processing tenant assignment:', selectedTenantId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Si se está asignando un inquilino
      if (selectedTenantId) {
        // Verificar si el inquilino ya tiene otra unidad asignada
        const { data: existingAssignment, error: checkError } = await supabase
          .from('tenants')
          .select('id, name')
          .eq('id', selectedTenantId)
          .single();

        if (checkError) {
          throw new Error('Error al verificar inquilino: ' + checkError.message);
        }

        // Check if tenant is already assigned to another unit
        const { data: currentUnits, error: unitCheckError } = await supabase
          .from('units')
          .select('id, unit_number')
          .eq('tenant_id', selectedTenantId);

        const currentUnit = currentUnits?.[0];

        if (!unitCheckError && currentUnit && currentUnit.id !== unit.id) {
          const confirmed = confirm(
            `⚠️ INQUILINO YA ASIGNADO\n\n` +
            `${existingAssignment.name} ya está asignado a la unidad ${currentUnit.unit_number}\n\n` +
            `¿Deseas reasignarlo a esta unidad?`
          );

          if (!confirmed) {
            setIsLoading(false);
            return;
          }

          // Unassign from current unit first
          await supabase
            .from('units')
            .update({ tenant_id: null, is_available: true })
            .eq('id', currentUnit.id);
        }

        // Verificar diferencia de renta
        await checkRentDifference(selectedTenantId, unit.monthly_rent || 0);

        // Asignación normal
        await assignTenantToUnit(selectedTenantId, unit.id, user.id);
      } else {
        // Desasignar inquilino de esta unidad
        await unassignTenantFromUnit(unit.id, user.id);
      }

      console.log('✅ Unit assignment processed successfully');

      // Close the form and show success message
      onClose();
      toast.success("Cambios guardados correctamente");

      // Refresh parent component
      if (onSave) {
        const updatedUnit: Unit = {
          ...unit,
          is_available: !selectedTenantId,
          tenant_id: selectedTenantId || null,
        };
        onSave(updatedUnit);
      }
    } catch (error) {
      console.error('❌ Error processing assignment:', error);
      toast.error(`Error: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const assignTenantToUnit = async (tenantId: string, unitId: string, userId: string) => {
    console.log('🏠 Assigning tenant to unit:', { tenantId, unitId });

    // Marcar unidad como ocupada y asignar inquilino
    const { data, error: unitError } = await supabase
      .from('units')
      .update({
        is_available: false,
        tenant_id: tenantId
      })
      .eq('id', unitId)
      .select('*')
      .single();

    if (unitError) {
      console.error('❌ Error assigning tenant to unit:', unitError);
      throw new Error('Error al asignar inquilino a unidad: ' + unitError.message);
    }

    console.log('✅ Tenant assigned to unit successfully:', data);
  };

  const unassignTenantFromUnit = async (unitId: string, userId: string) => {
    // Marcar unidad como disponible y desasignar inquilino
    const { error: unitError } = await supabase
      .from('units')
      .update({
        is_available: true,
        tenant_id: null
      })
      .eq('id', unitId);

    if (unitError) {
      throw new Error('Error al desasignar inquilino: ' + unitError.message);
    }
  };

  // Remove this function as we don't need to duplicate tenants

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
                  <SelectItem value="no-tenant">Sin inquilino</SelectItem>
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