import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Users, Plus } from "lucide-react";
import { UnitManagementModal } from "../units/UnitManagementModal";

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
  const [showUnitManagement, setShowUnitManagement] = useState(false);
  
  // Mock units data - in real app this would come from database
  const mockUnits: Unit[] = Array.from({ length: property?.units || 0 }, (_, i) => ({
    id: `unit-${i + 1}`,
    number: `${i + 1}`,
    type: 'Apartamento',
    rentAmount: 800 + (i * 50),
    isOccupied: Math.random() > 0.3,
    tenant: Math.random() > 0.3 ? `Inquilino ${i + 1}` : undefined
  }));

  if (!property) return null;

  const occupiedUnits = mockUnits.filter(unit => unit.isOccupied).length;
  const occupancyRate = property.units > 0 ? (occupiedUnits / property.units) * 100 : 0;
  const totalRevenue = mockUnits
    .filter(unit => unit.isOccupied)
    .reduce((sum, unit) => sum + unit.rentAmount, 0);

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
                  <div className="text-2xl font-bold">{property.units}</div>
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
                    {occupiedUnits} de {property.units} ocupadas
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Unidades ({property.units})
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => setShowUnitManagement(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Gestionar Unidades
                </Button>
              </CardHeader>
              <CardContent>
                {property.units > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mockUnits.map((unit) => (
                      <div 
                        key={unit.id}
                        className="p-3 border rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">Unidad {unit.number}</div>
                          <div className="text-sm text-muted-foreground">
                            €{unit.rentAmount}/mes
                          </div>
                          {unit.tenant && (
                            <div className="text-xs text-muted-foreground">
                              {unit.tenant}
                            </div>
                          )}
                        </div>
                        <Badge variant={unit.isOccupied ? "default" : "secondary"}>
                          {unit.isOccupied ? "Ocupada" : "Disponible"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay unidades configuradas</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowUnitManagement(true)}
                    >
                      Agregar Primera Unidad
                    </Button>
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

      {showUnitManagement && (
        <UnitManagementModal
          isOpen={showUnitManagement}
          onClose={() => setShowUnitManagement(false)}
          propertyId={property.id!}
          onUnitsUpdated={() => {
            console.log('Units updated for property:', property.name);
            setShowUnitManagement(false);
          }}
        />
      )}
    </>
  );
}