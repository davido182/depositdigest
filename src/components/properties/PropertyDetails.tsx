import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface Unit {
  id: string;
  number: string;
  type: string;
  rentAmount: number;
  isOccupied: boolean;
  tenant?: string;
}

interface PropertyDetailsProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (property: Property) => void;
}

export function PropertyDetails({ property, isOpen, onClose, onEdit }: PropertyDetailsProps) {
  
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (property?.id && isOpen) {
      loadUnits();
    }
  }, [property?.id, isOpen]);

  const loadUnits = async () => {
    if (!property?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', property.id);
        
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

  if (!property) return null;

  const occupiedUnits = units.filter(unit => !unit.is_available).length;
  const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;
  const totalRevenue = units
    .filter(unit => !unit.is_available)
    .reduce((sum, unit) => sum + (unit.rent_amount || 0), 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {property.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {property.address}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Property Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Unidades
                  </CardTitle>
                </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">{units.length}</div>
                 </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ocupación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
                   <p className="text-xs text-muted-foreground">
                     {occupiedUnits} de {units.length} ocupadas
                   </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ingresos Mensuales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {property.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{property.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Units Section */}
            <Card>
              <CardHeader>
                 <CardTitle className="text-base flex items-center gap-2">
                   <Users className="h-4 w-4" />
                   Unidades ({units.length})
                 </CardTitle>
              </CardHeader>
               <CardContent>
                 {loading ? (
                   <div className="text-center py-6 text-muted-foreground">
                     Cargando unidades...
                   </div>
                 ) : units.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {units.map((unit) => (
                       <div 
                         key={unit.id}
                         className="p-3 border rounded-lg flex justify-between items-center"
                       >
                         <div>
                           <div className="font-medium">Unidad {unit.unit_number}</div>
                           <div className="text-sm text-muted-foreground">
                             €{unit.rent_amount || 0}/mes
                           </div>
                         </div>
                         <Badge variant={unit.is_available ? "secondary" : "default"}>
                           {unit.is_available ? "Disponible" : "Ocupada"}
                         </Badge>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-6 text-muted-foreground">
                     <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                     <p>No hay unidades configuradas</p>
                     <p className="text-sm">Usa el botón "Gestionar Unidades" para agregar unidades</p>
                   </div>
                 )}
               </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={() => onEdit(property)}>
              Editar Propiedad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
  );
}