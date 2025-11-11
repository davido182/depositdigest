import { Layout } from "@/components/Layout";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { FinalDashboard } from "@/components/dashboard/FinalDashboard";
import { DebugCleaner } from "@/components/security/DebugCleaner";
import { EmergencySecurityOverlay } from "@/components/security/EmergencySecurityOverlay";

import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { FinalImport } from "@/components/data/FinalImport";
import TenantDashboard from "@/components/tenant/TenantDashboard";
import { Button } from "@/components/ui/button";
import { Tenant } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantService } from "@/services/TenantService";
import { useAppData } from "@/hooks/use-app-data";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";


interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  occupied_units: number;
  monthly_revenue: number;
  created_at: string;
}

const Dashboard = () => {
  const { userRole, user } = useAuth();
  const isMobile = useIsMobile();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appData = useAppData();
  const stats = (appData as any)?.stats || {
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    monthlyRevenue: 0,
    activeTenants: 0,
    occupancyRate: 0,
    collectionRate: 0,
    totalTenants: 0,
    overduePayments: 0,
    pendingDeposits: 0,
    upcomingMoveIns: 0,
    upcomingMoveOuts: 0
  };
  const refetch = (appData as any)?.refetch || (() => {});

  // Show tenant dashboard for tenant users
  if (userRole === 'tenant') {
    return <TenantDashboard />;
  }

  // Función de maintenance deshabilitada temporalmente

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Removed console.log for security

        // Load tenants
        const loadedTenants = await tenantService.getTenants();
        // Removed console.log for security
        setTenants(loadedTenants);

        // Load properties from database
        if (user) {
          const { data: dbProperties, error: propsError } = await supabase
            .from('properties')
            .select('*');

          if (!propsError && dbProperties) {
            // Get units for each property
            const { data: units, error: unitsError } = await supabase
              .from('units')
              .select('*');

            if (!unitsError && units) {
              const mappedProperties = dbProperties.map(dbProp => {
                const propertyUnits = units.filter(unit => unit.property_id === dbProp.id);
                const occupiedUnits = propertyUnits.filter(unit => !unit.is_available);
                const totalRevenue = occupiedUnits.reduce((sum, unit) => sum + (unit.rent_amount || 0), 0);

                // Removed console.log for security

                return {
                  id: dbProp.id,
                  name: dbProp.name,
                  address: dbProp.address || '',
                  units: propertyUnits.length,
                  occupied_units: occupiedUnits.length,
                  monthly_revenue: totalRevenue,
                  created_at: dbProp.created_at
                };
              });
              setProperties(mappedProperties);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleAddTenant = () => {
    if (userRole === 'landlord_free') {
      toast.error("La función de invitar inquilinos es exclusiva de usuarios Premium");
      return;
    }
    setCurrentTenant(null);
    setIsEditModalOpen(true);
  };

  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleAddProperty = () => {
    if (userRole === 'landlord_free' && properties.length >= 1) {
      toast.error("Los usuarios gratuitos pueden tener máximo 1 propiedad. Actualiza a Premium para propiedades ilimitadas.");
      return;
    }
    setIsPropertyModalOpen(true);
  };

  // Funciones de edición movidas a la página de Inquilinos

  const handleSaveTenant = async (updatedTenant: Tenant) => {
    try {
      if (currentTenant) {
        const updated = await tenantService.updateTenant(updatedTenant.id, updatedTenant);
        setTenants(tenants.map((t) => (t.id === updatedTenant.id ? updated : t)));
        toast.success("Inquilino actualizado exitosamente");
      } else {
        const newTenant = await tenantService.createTenant(updatedTenant);
        setTenants([...tenants, newTenant]);
        toast.success("Inquilino agregado exitosamente");
      }

      refetch();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error saving tenant:", error);
      toast.error("Error al guardar el inquilino");
    }
  };

  const handleSaveProperty = async (propertyData: Property) => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('properties')
        .insert([{
          name: propertyData.name,
          address: propertyData.address,
          description: (propertyData as any).description || '',
          total_units: propertyData.units,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Crear las unidades para la propiedad
      const units = Array.from({ length: propertyData.units }, (_, i) => ({
        property_id: data.id,
        unit_number: `${i + 1}`,
        is_available: true,
        user_id: user.id
      }));

      const { error: unitsError } = await supabase
        .from('units')
        .insert(units);

      if (unitsError) throw unitsError;

      const newProperty = {
        id: data.id,
        name: data.name,
        address: data.address || '',
        units: propertyData.units,
        occupied_units: 0,
        monthly_revenue: 0,
        created_at: data.created_at
      };

      setProperties([...properties, newProperty]);
      setIsPropertyModalOpen(false);
      toast.success("Propiedad creada exitosamente");
    } catch (error) {
      console.error("Error saving property:", error);
      toast.error("Error al crear la propiedad");
    }
  };

  return (
    <Layout>
      {/* Componentes de seguridad deshabilitados temporalmente */}
      {/* <EmergencySecurityOverlay /> */}
      {/* <DebugCleaner /> */}
      <div className={`space-y-6 ${isMobile ? 'px-2' : ''}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-semibold tracking-tight`}>Dashboard</h1>
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            {/* Botón de importar datos - solo para usuarios premium */}
            {userRole === 'landlord_premium' && (
              <Button
                onClick={() => setIsImportModalOpen(true)}
                variant="outline"
                className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                size={isMobile ? "sm" : "default"}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Importar Datos
              </Button>
            )}

            {userRole === 'landlord_premium' && (
              <Button onClick={handleAddTenant} className="gap-2" size={isMobile ? "sm" : "default"}>
                <Plus className="h-4 w-4" />
                Agregar Inquilino
              </Button>
            )}
            {(userRole === 'landlord_free' && properties.length === 0) || userRole === 'landlord_premium' ? (
              <Button
                onClick={handleAddProperty}
                variant="outline"
                className="gap-2"
                size={isMobile ? "sm" : "default"}
              >
                <Plus className="h-4 w-4" />
                Agregar Propiedad
              </Button>
            ) : null}
          </div>
        </div>

        <DashboardSummary />

        <FinalDashboard stats={stats} tenants={appData.data?.tenants || []} />

        {/* Las tarjetas de inquilinos se movieron a la sección de Inquilinos */}

        {isLoading && (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}


      </div>

      <TenantEditForm
        tenant={currentTenant}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTenant}
      />

      <PropertyForm
        property={null}
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSave={handleSaveProperty}
        userRole={userRole || 'landlord_free'}
      />

      <FinalImport
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          // Recargar datos después de importar
          setIsImportModalOpen(false);
          // Recargar datos sin recargar toda la página
          const loadData = async () => {
            try {
              const loadedTenants = await tenantService.getTenants();
              setTenants(loadedTenants);

              if (user) {
                const { data: dbProperties, error: propsError } = await supabase
                  .from('properties')
                  .select('*');

                if (!propsError && dbProperties) {
                  const { data: units, error: unitsError } = await supabase
                    .from('units')
                    .select('*');

                  if (!unitsError && units) {
                    const mappedProperties = dbProperties.map(dbProp => {
                      const propertyUnits = units.filter(unit => unit.property_id === dbProp.id);
                      const occupiedUnits = propertyUnits.filter(unit => !unit.is_available);
                      const totalRevenue = occupiedUnits.reduce((sum, unit) => sum + (unit.rent_amount || 0), 0);

                      return {
                        id: dbProp.id,
                        name: dbProp.name,
                        address: dbProp.address || '',
                        units: propertyUnits.length,
                        occupied_units: occupiedUnits.length,
                        monthly_revenue: totalRevenue,
                        created_at: dbProp.created_at
                      };
                    });
                    setProperties(mappedProperties);
                  }
                }
              }

              refetch(); // Recargar stats
              toast.success('Datos actualizados correctamente');
            } catch (error) {
              console.error('Error recargando datos:', error);
              toast.error('Error al actualizar los datos');
            }
          };

          loadData();
        }}
      />
    </Layout>
  );
};

export default Dashboard;
