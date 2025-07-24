import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface Property {
  id?: string;
  name: string;
  address: string;
  description?: string;
  units: number;
  occupied_units?: number;
  monthly_revenue?: number;
  created_at?: string;
}

interface PropertyFormProps {
  property?: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Property) => void;
  userRole: string;
}

export function PropertyForm({ property, isOpen, onClose, onSave, userRole }: PropertyFormProps) {
  const [formData, setFormData] = useState<Property>({
    name: property?.name || "",
    address: property?.address || "",
    description: property?.description || "",
    units: property?.units || 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: property?.name || "",
        address: property?.address || "",
        description: property?.description || "",
        units: property?.units || 1,
      });
      setErrors({});
    }
  }, [property, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const adjustUnits = (increment: boolean) => {
    const maxUnits = userRole === 'landlord_free' ? 3 : 999;
    const newUnits = increment ? formData.units + 1 : Math.max(1, formData.units - 1);
    
    if (newUnits > maxUnits) {
      toast.error(`Los usuarios gratuitos pueden tener máximo ${maxUnits} unidades por propiedad`);
      return;
    }
    
    setFormData(prev => ({ ...prev, units: newUnits }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la propiedad es requerido";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida";
    }
    
    if (formData.units < 1) {
      newErrors.units = "Debe tener al menos 1 unidad";
    }
    
    const maxUnits = userRole === 'landlord_free' ? 3 : 999;
    if (formData.units > maxUnits) {
      newErrors.units = `Los usuarios gratuitos pueden tener máximo ${maxUnits} unidades`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...formData,
        id: property?.id || `prop-${Date.now()}`,
        occupied_units: 0,
        monthly_revenue: 0,
        created_at: new Date().toISOString()
      });
      onClose(); // Close dialog after saving
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
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
                Nombre de la Propiedad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Edificio Central, Casa Norte"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Dirección completa de la propiedad"
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe características especiales de la propiedad"
                rows={3}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración de Unidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="units">Número de Unidades</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustUnits(false)}
                        disabled={formData.units <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-semibold min-w-[3ch] text-center">
                        {formData.units}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustUnits(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {userRole === 'landlord_free' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Plan Gratuito</Badge>
                      <span className="text-sm text-muted-foreground">
                        Máximo 3 unidades por propiedad
                      </span>
                    </div>
                  )}
                  
                  {errors.units && (
                    <p className="text-xs text-destructive">{errors.units}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {property ? "Actualizar" : "Crear"} Propiedad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}