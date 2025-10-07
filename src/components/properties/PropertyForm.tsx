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

  // Estado para las unidades individuales
  const [unitRents, setUnitRents] = useState<number[]>([0]); // Inicializar con al menos una unidad

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      const units = property?.units || 1;
      setFormData({
        name: property?.name || "",
        address: property?.address || "",
        description: property?.description || "",
        units: units,
      });
      
      // Inicializar rentas de unidades
      const initialRents = Array(units).fill(0);
      setUnitRents(initialRents);
      setErrors({});
    }
  }, [isOpen, property]);

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
    
    // Ajustar array de rentas
    const newRents = [...unitRents];
    if (increment) {
      newRents.push(0); // Nueva unidad sin renta definida
    } else {
      newRents.pop(); // Quitar última unidad
    }
    setUnitRents(newRents);
  };

  const updateUnitRent = (unitIndex: number, rent: number) => {
    const newRents = [...unitRents];
    newRents[unitIndex] = rent;
    setUnitRents(newRents);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la propiedad es requerido";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida";
    }

    // Validar que todas las unidades tengan renta definida
    const emptyRents = unitRents.filter(rent => rent <= 0);
    if (emptyRents.length > 0) {
      newErrors.units = "Todas las unidades deben tener una renta definida";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const { propertyService } = await import("@/services/PropertyService");
        
        if (property?.id) {
          // Update existing property
          await propertyService.updateProperty(property.id, {
            name: formData.name,
            address: formData.address,
            description: formData.description,
            total_units: formData.units
          });

          // Update units for existing property
          const { unitService } = await import("@/services/UnitService");
          
          // Get current units
          const currentUnits = await unitService.getUnitsByProperty(property.id);
          
          // If we need more units, create them
          if (formData.units > currentUnits.length) {
            for (let i = currentUnits.length; i < formData.units; i++) {
              await unitService.createUnit({
                property_id: property.id,
                unit_number: (i + 1).toString(),
                bedrooms: 1,
                bathrooms: 1,
                monthly_rent: unitRents[i] || 0,
                is_available: true
              });
            }
          }
          // If we need fewer units, delete the excess ones
          else if (formData.units < currentUnits.length) {
            for (let i = formData.units; i < currentUnits.length; i++) {
              await unitService.deleteUnit(currentUnits[i].id);
            }
          }
          
          // Update existing units with new rent amounts
          for (let i = 0; i < Math.min(formData.units, currentUnits.length); i++) {
            await unitService.updateUnit(currentUnits[i].id, {
              monthly_rent: unitRents[i] || 0
            });
          }
          
          toast.success("Propiedad y unidades actualizadas correctamente");
        } else {
          // Create new property
          const newProperty = await propertyService.createProperty({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            city: 'Madrid', // Default
            postal_code: '28001', // Default  
            country: 'España',
            property_type: 'apartment',
            total_units: formData.units
          });

          // Create units with individual rents
          const { unitService } = await import("@/services/UnitService");
          
          for (let i = 0; i < formData.units; i++) {
            await unitService.createUnit({
              property_id: newProperty.id,
              unit_number: (i + 1).toString(),
              bedrooms: 1,
              bathrooms: 1,
              monthly_rent: unitRents[i],
              is_available: true
            });
          }
          
          toast.success(`Propiedad creada con ${formData.units} unidades`);
        }
        
        onSave(formData);
        onClose();
      } catch (error) {
        console.error("Error saving property:", error);
        toast.error("Error al guardar la propiedad");
      }
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

                  {/* Campos de Renta por Unidad */}
                  <div className="space-y-3">
                    <Label>Renta Mensual por Unidad (€)</Label>
                    {Array.from({ length: formData.units }, (_, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`unit-${index}`} className="text-sm">
                            Unidad {index + 1}
                          </Label>
                          <Input
                            id={`unit-${index}`}
                            type="number"
                            min="0"
                            step="50"
                            value={unitRents[index] || ''}
                            onChange={(e) => updateUnitRent(index, parseFloat(e.target.value) || 0)}
                            placeholder="Ej: 800"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))}
                    {errors.units && (
                      <p className="text-sm text-red-500">{errors.units}</p>
                    )}
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