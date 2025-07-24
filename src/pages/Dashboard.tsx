import { Layout } from "@/components/Layout";
import { IntelligentDashboard } from "@/components/dashboard/IntelligentDashboard";
import { MaintenanceNotifications } from "@/components/dashboard/MaintenanceNotifications";
import { TenantCard } from "@/components/tenants/TenantCard";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import TenantDashboard from "@/components/tenant/TenantDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tenant } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building, Plus, Users, DollarSign, MapPin, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantService } from "@/services/TenantService";
import { usePropertyStats } from "@/hooks/use-property-stats";
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
  const { stats, refetch } = usePropertyStats();

  // Show tenant dashboard for tenant users
  if (userRole === 'tenant') {
    return <TenantDashboard />;
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('Loading tenants and properties from Supabase...');
        
        // Load tenants
        const loadedTenants = await tenantService.getTenants();
        console.log(`Dashboard: Loaded ${loadedTenants.length} tenants`);
        setTenants(loadedTenants);

        // Load properties (simulated from tenants data for now)
        if (user) {
          const { data: tenantsData, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('user_id', user.id);

          if (!error && tenantsData) {
            const propertyMap = new Map();
            tenantsData.forEach(tenant => {
              const propertyKey = tenant.unit_number?.substring(0, 1) || 'A';
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
                property.monthly_revenue += tenant.rent_amount || 0;
              }
            });
            setProperties(Array.from(propertyMap.values()));
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

  const handleAddProperty = () => {
    if (userRole === 'landlord_free' && properties.length >= 1) {
      toast.error("Los usuarios gratuitos pueden tener máximo 1 propiedad. Actualiza a Premium para propiedades ilimitadas.");
      return;
    }
    toast.info("Funcionalidad de agregar propiedad en desarrollo");
  };

  const handleEditTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setIsEditModalOpen(true);
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    try {
      await tenantService.deleteTenant(tenant.id);
      setTenants(tenants.filter(t => t.id !== tenant.id));
      refetch();
      toast.success(`Inquilino ${tenant.name} eliminado exitosamente`);
    } catch (error) {
      console.error("Error removing tenant:", error);
      toast.error("Error al eliminar el inquilino");
    }
  };

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

  return (
    <Layout>
      <div className={`space-y-6 ${isMobile ? 'px-2' : ''}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-semibold tracking-tight`}>Dashboard</h1>
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <MaintenanceNotifications />
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
        
        {/* Resumen de Propiedades */}
        {properties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Resumen de Propiedades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
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

        <IntelligentDashboard stats={stats} />

        {/* Tarjetas de Inquilinos */}
        {tenants.length > 0 && (
          <div className="space-y-4">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Mis Inquilinos</h2>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
              {tenants.slice(0, 6).map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onEdit={handleEditTenant}
                  onDelete={handleDeleteTenant}
                />
              ))}
            </div>
            {tenants.length > 6 && (
              <div className="text-center">
                <Button variant="outline" onClick={() => window.location.href = '/tenants'}>
                  Ver todos los inquilinos ({tenants.length})
                </Button>
              </div>
            )}
          </div>
        )}

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
    </Layout>
  );
};

export default Dashboard;