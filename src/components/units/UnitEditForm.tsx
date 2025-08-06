import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Unit {
  id: string;
  unit_number: string;
  rent_amount?: number | null;
  is_available: boolean;
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && unit) {
      setFormData({
        unit_number: unit.unit_number,
        rent_amount: unit.rent_amount || 0,
      });
      setErrors({});
    }
  }, [unit, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && unit) {
      const updatedUnit: Unit = {
        ...unit,
        unit_number: formData.unit_number,
        rent_amount: formData.rent_amount,
      };
      
      onSave(updatedUnit);
      onClose();
      toast.success("Unidad actualizada correctamente");
    }
  };

  if (!unit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Unidad</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="unit_number" className="text-sm font-medium">Número de Unidad</Label>
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

            <div className="space-y-2">
              <Label htmlFor="rent_amount" className="text-sm font-medium">Renta Mensual (€)</Label>
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
          </div>

          <DialogFooter className="gap-2 pt-4">
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