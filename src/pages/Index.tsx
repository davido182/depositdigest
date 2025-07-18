

import { Layout } from "@/components/Layout";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { TenantsGrid } from "@/components/dashboard/TenantsGrid";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import TenantDashboard from "@/components/tenant/TenantDashboard";
import { Tenant } from "@/types";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantService } from "@/services/TenantService";
import { usePropertyStats } from "@/hooks/use-property-stats";

const Index = () => {
  const { userRole } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { stats, refetch } = usePropertyStats();

  // Show tenant dashboard for tenant users
  if (userRole === 'tenant') {
    return <TenantDashboard />;
  }

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setIsLoading(true);
        console.log('Loading tenants from Supabase...');
        const loadedTenants = await tenantService.getTenants();
        console.log(`Dashboard: Loaded ${loadedTenants.length} tenants`);
        setTenants(loadedTenants);
      } catch (error) {
        console.error("Error loading tenants:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };

    loadTenants();
  }, []);

  const handleAddTenant = () => {
    setCurrentTenant(null);
    setIsEditModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setIsEditModalOpen(true);
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    try {
      await tenantService.deleteTenant(tenant.id);
      setTenants(tenants.filter(t => t.id !== tenant.id));
      refetch(); // Refresh stats
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
      
      refetch(); // Refresh stats
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error saving tenant:", error);
      toast.error("Error al guardar el inquilino");
    }
  };

  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <Button onClick={handleAddTenant} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Inquilino
          </Button>
        </div>
        
        <DashboardSummary />
      </section>

      <Tabs defaultValue="tenants" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tenants">Inquilinos</TabsTrigger>
        </TabsList>
        <TabsContent value="tenants" className="mt-2">
          {isLoading || stats.isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <TenantsGrid
              tenants={tenants}
              onEditTenant={handleEditTenant}
              onDeleteTenant={handleDeleteTenant}
            />
          )}
        </TabsContent>
      </Tabs>

      <TenantEditForm
        tenant={currentTenant}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTenant}
      />
    </Layout>
  );
};

export default Index;

