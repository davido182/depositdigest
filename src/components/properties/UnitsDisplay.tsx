import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UserPlus, UserMinus } from "lucide-react";
import { unitService } from "@/services/UnitService";
import { UnitEditForm } from "../units/UnitEditForm";
import { toast } from "sonner";

interface Unit {
  id: string;
  unit_number: string;
  rent_amount?: number | null;
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

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await unitService.getUnitsByProperty(propertyId);
      setUnits(data.slice(0, 3)); // Only show first 3 units in card
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
      await unitService.updateUnit(updatedUnit.id, {
        unit_number: updatedUnit.unit_number,
        monthly_rent: updatedUnit.rent_amount || 0,
        is_available: updatedUnit.is_available
      });

      // Update local state
      setUnits(prev => prev.map(unit => 
        unit.id === updatedUnit.id ? updatedUnit : unit
      ));

      setShowEditForm(false);
      setEditingUnit(null);
    } catch (error) {
      console.error('Error updating unit:', error);
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
            <div className="flex items-center gap-2">
              <span className="font-medium">Unidad {unit.unit_number}</span>
              <Badge variant={unit.is_available ? "secondary" : "default"} className="text-xs">
                {unit.is_available ? "Disponible" : "Ocupada"}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs">
                €{unit.rent_amount || 0}
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
        {units.length === 3 && (
          <div className="text-xs text-muted-foreground text-center">
            Y más...
          </div>
        )}
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