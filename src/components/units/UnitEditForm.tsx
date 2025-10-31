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
      // Removed console.log for security

      // Load tenants first, then set the selected tenant
      loadAvailableTenants().then(() => {
        // Find the tenant assigned to this unit
        findAssignedTenant(unit.id);
      });
    }
  }, [isOpen, unit]);

  const findAssignedTenant = async (unitId: string) => {
    try {
      // Removed console.log for security

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if unit has tenant_id assigned
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('tenant_id')
        .eq('id', unitId)
        .single();

      if (!unitError && unitData?.tenant_id) {
        // Removed console.log for security
        setSelectedTenantId(unitData.tenant_id);
      } else {
        // Removed console.log for security
        setSelectedTenantId("");
      }
    } catch (error) {
      // Removed console for security
      setSelectedTenantId("");
    }
  };

  const loadAvailableTenants = async () => {
    try {
      // Removed console.log for security

      // Get current user to filter tenants
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Removed console for security
        setAvailableTenants([]);
        return;
      }

      // Current user authenticated

      // Get all tenants for this user
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('landlord_id', user.id);

      if (error) {
        // Removed console for security
        setAvailableTenants([]);
        return;
      }

      // Removed console.log for security

      // Map the data to our interface using correct field names
      const mappedTenants = (data || []).map(tenant => ({
        id: tenant.id,
        name: tenant.name || `Inquilino ${tenant.id.slice(0, 8)}`,
        email: tenant.email || 'Sin email'
      }));

      // Removed console.log for security
      setAvailableTenants(mappedTenants);
      // Removed console.log for security
    } catch (error) {
      // Removed console for security
      setAvailableTenants([]);
    }
  };

  const handleTenantChange = (value: string) => {
    // Removed console.log for security
    // Handle "no-tenant" as empty string
    const tenantId = value === "no-tenant" ? "" : value;
    setSelectedTenantId(tenantId);
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
        // Removed console.log for security
        return;
      }

      const tenantRent = tenantData.rent_amount || 0;
      const tenantName = tenantData.name;

      if (Math.abs(tenantRent - unitRent) > 0.01) { // Diferencia mayor a 1 centavo
        // Crear un diálogo más sofisticado con múltiples opciones
        const choice = prompt(
          `⚠️ DIFERENCIA DE RENTA DETECTADA\n\n` +
          `Inquilino: ${tenantName}\n` +
          `Renta en perfil del inquilino: €${tenantRent}\n` +
          `Renta de la unidad: €${unitRent}\n\n` +
          `Opciones:\n` +
          `1 - Actualizar inquilino a €${unitRent} (renta de la unidad)\n` +
          `2 - Actualizar unidad a €${tenantRent} (renta del inquilino)\n` +
          `3 - Mantener ambos valores sin cambios\n\n` +
          `Ingresa 1, 2 o 3:`
        );

        if (choice === '1') {
          // Actualizar la renta del inquilino
          await supabase
            .from('tenants')
            .update({ rent_amount: unitRent })
            .eq('id', tenantId);

          toast.success(`Renta del inquilino actualizada a €${unitRent}`);
        } else if (choice === '2') {
          // Actualizar la renta de la unidad
          await supabase
            .from('units')
            .update({ monthly_rent: tenantRent })
            .eq('id', unit.id);

          // Actualizar el estado local
          setFormData(prev => ({ ...prev, monthly_rent: tenantRent }));
          toast.success(`Renta de la unidad actualizada a €${tenantRent}`);
        } else if (choice === '3') {
          toast.info('Valores de renta mantenidos sin cambios');
        }
      }
    } catch (error) {
      console.error('Error checking rent difference:', error);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unit) {
      // Removed console.log for security
      return;
    }

    try {
      setIsLoading(true);
      // Removed console.log for security

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Si se está asignando un inquilino (no "no-tenant")
      if (selectedTenantId && selectedTenantId !== "no-tenant") {
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

      // Removed console.log for security

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
    // Removed console.log for security

    // Step 1: Get unit and property information
    const { data: unitData, error: unitFetchError } = await supabase
      .from('units')
      .select(`
        id,
        unit_number,
        property_id,
        monthly_rent,
        properties!inner(
          id,
          name,
          landlord_id
        )
      `)
      .eq('id', unitId)
      .single();

    if (unitFetchError || !unitData) {
      console.error('❌ Error fetching unit data:', unitFetchError);
      throw new Error('Error al obtener datos de la unidad');
    }

    // Removed console.log for security

    // Step 2: Update units table (mark as occupied)
    const { error: unitError } = await supabase
      .from('units')
      .update({
        is_available: false,
        tenant_id: tenantId
      })
      .eq('id', unitId);

    if (unitError) {
      console.error('❌ Error updating unit:', unitError);
      throw new Error('Error al actualizar unidad: ' + unitError.message);
    }

    // Step 3: Update tenants table with unit and property info (BIDIRECTIONAL SYNC)
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({
        unit_number: unitData.unit_number,
        property_id: unitData.property_id,
        property_name: unitData.properties.name,
        rent_amount: unitData.monthly_rent || 0
      })
      .eq('id', tenantId)
      .eq('landlord_id', userId);

    if (tenantError) {
      // Removed console for security
      // Don't throw error here - unit assignment worked, this is just sync
      // Removed console.log for security
    } else {
      // Removed console.log for security
    }

    // Removed console.log for security
  };

  const unassignTenantFromUnit = async (unitId: string, userId: string) => {
    // Removed console.log for security

    // Step 1: Get current tenant assigned to this unit
    const { data: unitData, error: unitFetchError } = await supabase
      .from('units')
      .select('tenant_id')
      .eq('id', unitId)
      .single();

    if (unitFetchError) {
      throw new Error('Error al obtener datos de la unidad: ' + unitFetchError.message);
    }

    const currentTenantId = unitData?.tenant_id;

    // Step 2: Update units table (mark as available)
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

    // Step 3: Clear unit info from tenant record (BIDIRECTIONAL SYNC)
    if (currentTenantId) {
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          unit_number: null,
          property_id: null,
          property_name: null
        })
        .eq('id', currentTenantId)
        .eq('landlord_id', userId);

      if (tenantError) {
        // Removed console for security
        // Removed console.log for security
      } else {
        // Removed console.log for security
      }
    }

    // Removed console.log for security
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

