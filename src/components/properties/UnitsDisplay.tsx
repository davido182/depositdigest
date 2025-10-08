import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus } from "lucide-react";
import { unitService } from "@/services/UnitService";
import { UnitEditForm } from "../units/UnitEditForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Component to show tenant name for occupied units
const TenantName = ({ unitId }: { unitId: string }) => {
  const [tenantName, setTenantName] = useState<string>("");

  useEffect(() => {
    const loadTenantName = async () => {
      try {
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('first_name, last_name')
          .eq('unit_id', unitId)
          .single();

        if (!error && tenant) {
          const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim();
          setTenantName(name || 'Inquilino');
        }
      } catch (error) {
        console.log('Could not load tenant name for unit:', unitId);
      }
    };

    loadTenantName();
  }, [unitId]);

  if (!tenantName) return null;

  return (
    <span className="text-xs text-muted-foreground">
      👤 {tenantName}
    </span>
  );
};

interface Unit {
  id: string;
  unit_number: string;
  rent_amount?: number | null;
  monthly_rent?: number | null;
  is_available: boolean;
  tenant_id?: string | null;
}

interface UnitsDisplayProps {
  propertyId: string;
}

export function UnitsDisplay({ propertyId }: UnitsDisplayProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);


  useEffect(() => {
    loadUnits();
  }, [propertyId]);

  // Only reload when window gets focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      loadUnits();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await unitService.getUnitsByProperty(propertyId);
      setUnits(data); // Show all units now
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setShowEditForm(true);
  };

  const handleSaveUnit = async (updatedUnit: Unit) => {
    try {
      console.log('🔄 Saving unit in UnitsDisplay:', updatedUnit);

      // Prepare the update data
      const updateData = {
        unit_number: updatedUnit.unit_number,
        monthly_rent: updatedUnit.monthly_rent || updatedUnit.rent_amount || 0,
        is_available: updatedUnit.is_available
        // No incluir tenant_id aquí ya que la tabla units no lo tiene aún
      };

      console.log('🔄 Update data being sent:', updateData);

      // Update in database
      const result = await unitService.updateUnit(updatedUnit.id, updateData);

      console.log('✅ Unit updated successfully in database:', result);

      // If assigning a tenant, also update the tenant record
      if (updatedUnit.tenant_id) {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const { error: tenantError } = await supabase
            .from('tenants')
            .update({ unit_id: updatedUnit.id })
            .eq('id', updatedUnit.tenant_id);

          if (tenantError) {
            console.error('Error updating tenant assignment:', tenantError);
          } else {
            console.log('Tenant assigned to unit successfully');
          }
        } catch (tenantError) {
          console.error('Error updating tenant assignment:', tenantError);
        }
      }

      // Force reload to get fresh data from database
      await loadUnits();

      toast.success("Unidad actualizada correctamente");
    } catch (error) {
      console.error('Error updating unit:', error);
      toast.error("Error al actualizar la unidad");
      throw error;
    }
  };

  const handleDeleteUnit = async (unit: Unit) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la unidad ${unit.unit_number}?`)) {
      return;
    }

    try {
      await unitService.deleteUnit(unit.id);
      setUnits(prev => prev.filter(u => u.id !== unit.id));
      toast.success("Unidad eliminada correctamente");
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast.error("Error al eliminar la unidad");
    }
  };

  const handleCreateUnit = async () => {
    if (!newUnitNumber.trim()) {
      toast.error("El número de unidad es requerido");
      return;
    }

    try {
      const newUnit = await unitService.createUnit({
        property_id: propertyId,
        unit_number: newUnitNumber,
        monthly_rent: 0,
        is_available: true,
      });

      setUnits(prev => [...prev, newUnit]);
      setNewUnitNumber("");
      setShowCreateForm(false);
      toast.success("Unidad creada correctamente");
    } catch (error) {
      console.error('Error creating unit:', error);
      toast.error("Error al crear unidad");
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No hay unidades configuradas
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="flex items-center justify-between p-2 border rounded text-xs"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{unit.unit_number}</span>
                <Badge variant={unit.is_available ? "secondary" : "default"} className="text-xs">
                  {unit.is_available ? "Disponible" : "Ocupada"}
                </Badge>
              </div>
              {!unit.is_available && (
                <TenantName unitId={unit.id} />
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs">
                €{unit.monthly_rent || unit.rent_amount || 0}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleEditUnit(unit)}
                title="Editar unidad"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                onClick={() => handleDeleteUnit(unit)}
                title="Eliminar unidad"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}


      </div>

      <UnitEditForm
        unit={editingUnit}
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingUnit(null);
        }}
        onSave={handleSaveUnit}
      />
    </>
  );
}