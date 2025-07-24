import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building, Users, DollarSign, MapPin, Calendar, Edit, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { PropertyDetails } from "@/components/properties/PropertyDetails";

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
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    const loadProperties = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // For now, we'll simulate properties based on tenants data
        const { data: tenants, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error loading tenants:", error);
          toast.error("Error al cargar propiedades");
          return;
        }

        // Group tenants by unit_number and create mock properties
        const propertyMap = new Map();
        tenants.forEach(tenant => {
          const propertyKey = tenant.unit_number.substring(0, 1); // Use first character as building identifier
          const propertyName = `Edificio ${propertyKey}`;
          
          if (!propertyMap.has(propertyName)) {
            propertyMap.set(propertyName, {
              id: `prop-${propertyKey}`,
              name: propertyName,
              address: `Calle Principal ${propertyKey}00, Madrid`,
              units: 0,
              occupied_units: 0,
              monthly_revenue: 0,
              created_at: new Date().toISOString()
            });
          }
          
          const property = propertyMap.get(propertyName);
          property.units += 1;
          if (tenant.status === 'active') {
            property.occupied_units += 1;
            property.monthly_revenue += tenant.rent_amount;
          }
        });

        // Sort properties numerically
        const sortedProperties = Array.from(propertyMap.values()).sort((a, b) => {
          const aNumber = parseInt(a.name.match(/\d+/)?.[0] || '0');
          const bNumber = parseInt(b.name.match(/\d+/)?.[0] || '0');
          return aNumber - bNumber;
        });
        setProperties(sortedProperties);
      } catch (error) {
        console.error("Error loading properties:", error);
        toast.error("Error al cargar propiedades");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [user]);

  const handleAddProperty = () => {
    if (userRole === 'landlord_free' && properties.length >= 1) {
      toast.error("Los usuarios gratuitos pueden tener máximo 1 propiedad. Actualiza a Premium para propiedades ilimitadas.");
      return;
    }
    setSelectedProperty(null);
    setShowPropertyForm(true);
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowPropertyForm(true);
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handleSaveProperty = (property: Property) => {
    if (selectedProperty) {
      // Update existing property
      setProperties(prev => prev.map(p => p.id === property.id ? property : p));
      toast.success("Propiedad actualizada exitosamente");
    } else {
      // Add new property
      setProperties(prev => [...prev, property]);
      toast.success("Propiedad agregada exitosamente");
    }
    setShowPropertyForm(false);
    setSelectedProperty(null);
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
          <Button onClick={handleAddProperty} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Propiedad
          </Button>
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

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Registrada</span>
                    </div>
                    <span>{new Date(property.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleViewProperty(property)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleEditProperty(property)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Propiedad
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {properties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Propiedades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {properties.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Propiedades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {properties.reduce((acc, prop) => acc + prop.occupied_units, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Unidades Ocupadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    €{properties.reduce((acc, prop) => acc + prop.monthly_revenue, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Ingresos Totales</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
      </div>
    </Layout>
  );
};

export default Properties;