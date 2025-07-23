import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Plus, Users, Home, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { UnitForm } from "./UnitForm";

interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  total_units: number;
  created_at: string;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  is_occupied: boolean;
  tenant_name?: string;
  created_at: string;
}

interface PropertyDetailProps {
  propertyId: string;
  onEdit: () => void;
  onBack: () => void;
}

export function PropertyDetail({ propertyId, onEdit, onBack }: PropertyDetailProps) {
  const { user, userRole } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);

  useEffect(() => {
    loadPropertyData();
  }, [propertyId]);

  const loadPropertyData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Cargar información de la propiedad
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', user.id)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Cargar unidades de la propiedad
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select(`
          *,
          tenants(name)
        `)
        .eq('property_id', propertyId)
        .order('unit_number');

      if (unitsError) throw unitsError;
      setUnits(unitsData.map(unit => ({
        ...unit,
        tenant_name: unit.tenants?.[0]?.name
      })));

    } catch (error) {
      console.error("Error loading property data:", error);
      toast.error("Error al cargar los datos de la propiedad");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUnit = () => {
    if (userRole === 'landlord_free' && units.length >= 3) {
      toast.error("Los usuarios gratuitos pueden tener máximo 3 unidades por propiedad. Actualiza a Premium para unidades ilimitadas.");
      return;
    }
    setCurrentUnit(null);
    setIsUnitFormOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setCurrentUnit(unit);
    setIsUnitFormOpen(true);
  };

  const handleUnitSaved = () => {
    loadPropertyData();
    setIsUnitFormOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Propiedad no encontrada</h3>
          <Button onClick={onBack}>Volver a Propiedades</Button>
        </CardContent>
      </Card>
    );
  }

  const occupiedUnits = units.filter(unit => unit.is_occupied).length;
  const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;
  const totalRevenue = units.reduce((sum, unit) => sum + (unit.is_occupied ? unit.rent_amount : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Volver a Propiedades
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Building className="h-6 w-6" />
            <h1 className="text-3xl font-semibold">{property.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{property.address}</span>
          </div>
          {property.description && (
            <p className="mt-2 text-muted-foreground">{property.description}</p>
          )}
        </div>
        <Button onClick={onEdit} variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Editar Propiedad
        </Button>
      </div>

      {/* Estadísticas de la propiedad */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Unidades</p>
                <p className="text-2xl font-bold">{units.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold">{occupiedUnits}/{units.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tasa Ocupación</p>
                <p className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <span className="text-green-600">€</span>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Mensuales</p>
                <p className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de unidades */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Unidades de la Propiedad</CardTitle>
              <CardDescription>
                Gestiona las unidades individuales de esta propiedad
              </CardDescription>
            </div>
            <Button onClick={handleAddUnit} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Unidad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay unidades registradas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando la primera unidad a esta propiedad.
              </p>
              <Button onClick={handleAddUnit}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Unidad
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <Card key={unit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">Unidad {unit.unit_number}</h4>
                        <p className="text-sm text-muted-foreground">
                          €{unit.rent_amount.toLocaleString()}/mes
                        </p>
                      </div>
                      <Badge variant={unit.is_occupied ? "default" : "secondary"}>
                        {unit.is_occupied ? "Ocupada" : "Disponible"}
                      </Badge>
                    </div>
                    
                    {unit.is_occupied && unit.tenant_name && (
                      <div className="mb-3">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Inquilino:</span> {unit.tenant_name}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditUnit(unit)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UnitForm
        unit={currentUnit}
        propertyId={propertyId}
        isOpen={isUnitFormOpen}
        onClose={() => setIsUnitFormOpen(false)}
        onSave={handleUnitSaved}
      />
    </div>
  );
}