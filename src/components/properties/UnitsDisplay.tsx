import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UnitEditForm } from "../units/UnitEditForm";

interface Unit {
  id: string;
  unit_number: string;
  rent_amount?: number | null;
  is_available: boolean;
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
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', propertyId)
        .limit(3); // Only show first 3 units in card
        
      if (error) {
        console.error('Error loading units:', error);
        return;
      }
      
      setUnits(data || []);
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
      const { error } = await supabase
        .from('units')
        .update({
          unit_number: updatedUnit.unit_number,
          rent_amount: updatedUnit.rent_amount
        })
        .eq('id', updatedUnit.id);

      if (error) throw error;

      // Update local state
      setUnits(prev => prev.map(unit => 
        unit.id === updatedUnit.id 
          ? { ...unit, unit_number: updatedUnit.unit_number, rent_amount: updatedUnit.rent_amount }
          : unit
      ));

      setShowEditForm(false);
      setEditingUnit(null);
    } catch (error) {
      console.error('Error updating unit:', error);
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
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                €{unit.rent_amount || 0}/mes
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleEditUnit(unit)}
              >
                <Edit className="h-3 w-3" />
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