import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Home, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Unit {
  id?: string;
  unit_number: string;
  rent_amount: number;
  is_occupied?: boolean;
}

interface UnitFormProps {
  unit?: Unit | null;
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function UnitForm({ unit, propertyId, isOpen, onClose, onSave }: UnitFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Unit>({
    unit_number: unit?.unit_number || "",
    rent_amount: unit?.rent_amount || 0,
    is_occupied: unit?.is_occupied || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rent_amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      if (unit) {
        // Actualizar unidad existente
        const { error } = await supabase
          .from('units')
          .update({
            unit_number: formData.unit_number,
            rent_amount: formData.rent_amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', unit.id);

        if (error) throw error;
        toast.success("Unidad actualizada exitosamente");
      } else {
        // Crear nueva unidad
        const { error } = await supabase
          .from('units')
          .insert({
            property_id: propertyId,
            unit_number: formData.unit_number,
            rent_amount: formData.rent_amount,
            is_occupied: false,
          });

        if (error) throw error;
        toast.success("Unidad creada exitosamente");
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving unit:", error);
      toast.error("Error al guardar la unidad");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {unit ? "Editar Unidad" : "Agregar Nueva Unidad"}
          </DialogTitle>
          <DialogDescription>
            {unit
              ? "Actualiza la información de la unidad."
              : "Ingresa los detalles de la nueva unidad."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="unit_number" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Número de Unidad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit_number"
                name="unit_number"
                value={formData.unit_number}
                onChange={handleChange}
                placeholder="ej., 101, A1, etc."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rent_amount" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Monto de Renta (€) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rent_amount"
                name="rent_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.rent_amount}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : (unit ? "Actualizar" : "Crear Unidad")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}