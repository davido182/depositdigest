import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Property {
  id?: string;
  name: string;
  address: string;
  description?: string;
  total_units: number;
}

interface PropertyFormProps {
  property?: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function PropertyForm({ property, isOpen, onClose, onSave }: PropertyFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Property>({
    name: property?.name || "",
    address: property?.address || "",
    description: property?.description || "",
    total_units: property?.total_units || 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_units' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      if (property) {
        // Actualizar propiedad existente
        const { error } = await supabase
          .from('properties')
          .update({
            name: formData.name,
            address: formData.address,
            description: formData.description,
            total_units: formData.total_units,
            updated_at: new Date().toISOString(),
          })
          .eq('id', property.id);

        if (error) throw error;
        toast.success("Propiedad actualizada exitosamente");
      } else {
        // Crear nueva propiedad
        const { error } = await supabase
          .from('properties')
          .insert({
            user_id: user.id,
            name: formData.name,
            address: formData.address,
            description: formData.description,
            total_units: formData.total_units,
          });

        if (error) throw error;
        toast.success("Propiedad creada exitosamente");
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving property:", error);
      toast.error("Error al guardar la propiedad");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {property ? "Editar Propiedad" : "Agregar Nueva Propiedad"}
          </DialogTitle>
          <DialogDescription>
            {property
              ? "Actualiza la información de la propiedad."
              : "Ingresa los detalles de la nueva propiedad."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                Nombre de la Propiedad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ej., Edificio Central"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="ej., Calle Principal 123, Madrid"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="total_units">
                Número Total de Unidades <span className="text-destructive">*</span>
              </Label>
              <Input
                id="total_units"
                name="total_units"
                type="number"
                min="1"
                max="100"
                value={formData.total_units}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripción adicional de la propiedad..."
                className="min-h-[80px]"
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
              {isSubmitting ? "Guardando..." : (property ? "Actualizar" : "Crear Propiedad")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}