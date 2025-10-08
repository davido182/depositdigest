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

      // Find tenant with this property_id (unit assignment)
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('property_id', unitId)
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
          .select('id, name, property_id')
          .eq('id', selectedTenantId)
          .single();

        if (checkError) {
          throw new Error('Error al verificar inquilino: ' + checkError.message);
        }

        // Si el inquilino ya tiene una unidad asignada
        if (existingAssignment.property_id && existingAssignment.property_id !== unit.id) {
          const tenantName = existingAssignment.name;
          const currentUnit = 'Otra unidad';
          const currentProperty = 'Otra propiedad';

          const confirmed = confirm(
            `⚠️ INQUILINO YA ASIGNADO\n\n` +
            `${tenantName} ya está asignado a:\n` +
            `${currentUnit} en ${currentProperty}\n\n` +
            `¿Deseas asignarlo también a esta unidad?\n` +
            `Esto creará una nueva entrada en el seguimiento de pagos.`
          );

          if (!confirmed) {
            setIsLoading(false);
            return;
          }

          // Crear una nueva entrada de inquilino para esta unidad
          await createDuplicateTenantEntry(existingAssignment, unit, user.id);
        } else {
          // Verificar diferencia de renta
          await checkRentDifference(selectedTenantId, unit.monthly_rent || 0);

          // Asignación normal
          await assignTenantToUnit(selectedTenantId, unit.id, user.id);
        }
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
    // Asignar inquilino a esta unidad
    const { error: assignError } = await supabase
      .from('tenants')
      .update({ property_id: unitId })
      .eq('id', tenantId)
      .eq('landlord_id', userId);

    if (assignError) {
      throw new Error('Error al asignar inquilino: ' + assignError.message);
    }

    // Marcar unidad como ocupada
    const { error: unitError } = await supabase
      .from('units')
      .update({ is_available: false })
      .eq('id', unitId);

    if (unitError) {
      throw new Error('Error al actualizar disponibilidad: ' + unitError.message);
    }
  };

  const unassignTenantFromUnit = async (unitId: string, userId: string) => {
    // Desasignar inquilino de esta unidad
    const { error: unassignError } = await supabase
      .from('tenants')
      .update({ property_id: null })
      .eq('property_id', unitId)
      .eq('landlord_id', userId);

    if (unassignError) {
      throw new Error('Error al desasignar inquilino: ' + unassignError.message);
    }

    // Marcar unidad como disponible
    const { error: unitError } = await supabase
      .from('units')
      .update({ is_available: true })
      .eq('id', unitId);

    if (unitError) {
      throw new Error('Error al actualizar disponibilidad: ' + unitError.message);
    }
  };

  const createDuplicateTenantEntry = async (originalTenant: any, targetUnit: Unit, userId: string) => {
    // Crear una nueva entrada de inquilino para la nueva unidad
    const { error: createError } = await supabase
      .from('tenants')
      .insert({
        landlord_id: userId,
        name: originalTenant.name,
        email: originalTenant.email,
        phone: originalTenant.phone,
        property_id: targetUnit.id,
        rent_amount: targetUnit.monthly_rent || 0,
        lease_start_date: new Date().toISOString().split('T')[0],
        is_active: true
      });

    if (createError) {
      throw new Error('Error al crear nueva entrada de inquilino: ' + createError.message);
    }

    // Marcar unidad como ocupada
    const { error: unitError } = await supabase
      .from('units')
      .update({ is_available: false })
      .eq('id', targetUnit.id);

    if (unitError) {
      throw new Error('Error al actualizar disponibilidad: ' + unitError.message);
    }

    toast.success('Nueva entrada de inquilino creada para esta unidad');
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