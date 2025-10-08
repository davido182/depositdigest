import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building, Users, DollarSign, MapPin, Edit, Trash2 } from "lucide-react";
import { UnitsDisplay } from "@/components/properties/UnitsDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { PropertyDetails } from "@/components/properties/PropertyDetails";
import { FinalImport } from "@/components/data/FinalImport";
import { propertyService } from "@/services/PropertyService";
import { useUserLimits } from "@/hooks/use-user-limits";

interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  occupied_units: number;
  monthly_revenue: number;
  created_at: string;
}

const Properties = () => {
  const { user, userRole } = useAuth();
  const { maxProperties } = useUserLimits();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const loadProperties = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        console.log('Loading properties and calculating stats...');

        // Load properties from database
        const dbProperties = await propertyService.getProperties();
        console.log('DB Properties loaded:', dbProperties.length);

        // Get tenants and units to calculate occupancy
        const [tenantsResult, unitsResult] = await Promise.all([
          supabase.from('tenants').select('*'),
          supabase.from('units').select('*')
        ]);

        if (tenantsResult.error) {
          console.error("Error loading tenants:", tenantsResult.error);
          toast.error("Error al cargar inquilinos");
          return;
        }

        if (unitsResult.error) {
          console.error("Error loading units:", unitsResult.error);
          toast.error("Error al cargar unidades");
          return;
        }

        const tenants = tenantsResult.data || [];
        const units = unitsResult.data || [];

        console.log('Tenants loaded:', tenants.length);
        console.log('Units loaded:', units.length);

        // Map database properties to component format and calculate occupancy
        const mappedProperties = dbProperties.map(dbProp => {
          // Get units for this property
          const propertyUnits = units.filter(unit => unit.property_id === dbProp.id);
          const occupiedUnits = propertyUnits.filter(unit => !unit.is_available);

          console.log(`Property ${dbProp.name}:`, {
            totalUnits: propertyUnits.length,
            occupiedUnits: occupiedUnits.length,
            propertyUnits: propertyUnits.map(u => ({ id: u.id, unit_number: u.unit_number, is_available: u.is_available, rent_amount: u.rent_amount }))
          });

          // Calculate revenue from occupied units
          const monthlyRevenue = occupiedUnits.reduce((sum, unit) => sum + (unit.monthly_rent || unit.rent_amount || 0), 0);

          return {
            id: dbProp.id,
            name: dbProp.name,
            address: dbProp.address || 'Dirección no especificada',
            units: propertyUnits.length,
            occupied_units: occupiedUnits.length,
            monthly_revenue: monthlyRevenue,
            created_at: dbProp.created_at
          };
        });

        console.log('Final mapped properties:', mappedProperties);
        setProperties(mappedProperties);
      } catch (error) {
        console.error("Error loading properties:", error);
        toast.error("Error al cargar propiedades");
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  const handleAddProperty = () => {
    if (properties.length >= maxProperties) {
      toast.error(`Los usuarios gratuitos pueden tener máximo ${maxProperties} propiedad${maxProperties > 1 ? 'es' : ''}. Actualiza a Premium para propiedades ilimitadas.`);
      return;
    }
    setSelectedProperty(null);
    setShowPropertyForm(true);
  };

  const handleDeleteProperty = async (property: Property) => {
    try {
      await propertyService.deleteProperty(property.id);
      setProperties(prev => prev.filter(p => p.id !== property.id));
      toast.success("Propiedad eliminada exitosamente");
    } catch (error: any) {
      console.error("Error deleting property:", error);
      toast.error(error.message || "Error al eliminar la propiedad");
    }
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowPropertyForm(true);
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handleSaveProperty = async (property: Property) => {
    setShowPropertyForm(false);
    setSelectedProperty(null);
    // Reload properties after save to ensure persistence
    if (!user) return;

    try {
      setIsLoading(true);

      // Load properties from database
      const dbProperties = await propertyService.getProperties();
      console.log('Reloading properties after save...');

      // Get tenants and units to calculate occupancy
      const [tenantsResult, unitsResult] = await Promise.all([
        supabase.from('tenants').select('*'),
        supabase.from('units').select('*')
      ]);

      if (tenantsResult.error) {
        console.error("Error loading tenants:", tenantsResult.error);
        toast.error("Error al cargar inquilinos");
        return;
      }

      if (unitsResult.error) {
        console.error("Error loading units:", unitsResult.error);
        toast.error("Error al cargar unidades");
        return;
      }

      const tenants = tenantsResult.data || [];
      const units = unitsResult.data || [];

      // Map database properties to component format and calculate occupancy
      const mappedProperties = dbProperties.map(dbProp => {
        // Get units for this property
        const propertyUnits = units.filter(unit => unit.property_id === dbProp.id);
        const occupiedUnits = propertyUnits.filter(unit => !unit.is_available);

        // Calculate revenue from occupied units
        const monthlyRevenue = occupiedUnits.reduce((sum, unit) => sum + (unit.monthly_rent || unit.rent_amount || 0), 0);

        return {
          id: dbProp.id,
          name: dbProp.name,
          address: dbProp.address || 'Dirección no especificada',
          units: propertyUnits.length,
          occupied_units: occupiedUnits.length,
          monthly_revenue: monthlyRevenue,
          created_at: dbProp.created_at
        };
      });

      setProperties(mappedProperties);

      if (selectedProperty) {
        toast.success("Propiedad actualizada exitosamente");
      } else {
        toast.success("Propiedad agregada exitosamente");
      }
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Error al cargar propiedades");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Propiedades</h1>
            <p className="text-muted-foreground">Gestiona tus propiedades inmobiliarias</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowImportModal(true)} 
              className="gap-2"
            >
              <Building className="h-4 w-4" />
              Importar Datos
            </Button>
            <Button onClick={handleAddProperty} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Propiedad
            </Button>
          </div>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay propiedades</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comienza agregando tu primera propiedad para gestionar inquilinos y pagos.
              </p>
              <Button onClick={handleAddProperty}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Propiedad
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Card - Moved to top of properties */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Propiedades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {properties.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Propiedades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {properties.reduce((acc, prop) => acc + prop.units, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Unidades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {properties.reduce((acc, prop) => acc + prop.occupied_units, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Unidades Ocupadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {properties.reduce((acc, prop) => acc + prop.units, 0) - properties.reduce((acc, prop) => acc + prop.occupied_units, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Unidades Disponibles</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        {property.name}
                      </CardTitle>
                      <Badge variant={property.occupied_units === property.units ? "default" : "secondary"}>
                        {property.occupied_units === property.units ? "Completo" : "Disponible"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {property.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Ocupación</span>
                      </div>
                      <span className="font-medium">
                        {property.occupied_units}/{property.units} unidades
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Ingresos</span>
                      </div>
                      <span className="font-medium text-green-600">
                        €{property.monthly_revenue.toLocaleString()}/mes
                      </span>
                    </div>


                    {/* Units List */}
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Unidades ({property.units})
                      </h4>
                      <UnitsDisplay propertyId={property.id} />
                    </div>

                    <div className="pt-4 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="flex-1"
                          size="sm"
                          onClick={() => handleEditProperty(property)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 text-destructive hover:text-destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer.")) {
                              handleDeleteProperty(property);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}


        <PropertyForm
          property={selectedProperty}
          isOpen={showPropertyForm}
          onClose={() => {
            setShowPropertyForm(false);
            setSelectedProperty(null);
          }}
          onSave={handleSaveProperty}
          userRole={userRole || 'landlord_free'}
        />

        <PropertyDetails
          property={selectedProperty}
          isOpen={showPropertyDetails}
          onClose={() => {
            setShowPropertyDetails(false);
            setSelectedProperty(null);
          }}
          onEdit={(property) => {
            setShowPropertyDetails(false);
            // Convert property to match the state interface
            const stateProperty: Property = {
              id: property.id || '',
              name: property.name,
              address: property.address,
              units: property.units,
              occupied_units: 0,
              monthly_revenue: 0,
              created_at: new Date().toISOString()
            };
            setSelectedProperty(stateProperty);
            setShowPropertyForm(true);
          }}
        />

        <FinalImport
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            setShowImportModal(false);
            loadProperties(); // Reload properties after import
          }}
        />
      </div>
    </Layout>
  );
};

export default Properties;