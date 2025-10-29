

import { Layout } from "@/components/Layout";
import { TenantsTable } from "@/components/tenants/TenantsTable";
import { TenantCards } from "@/components/tenants/TenantCards";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
// import { UnitManagementModal } from "@/components/units/UnitManagementModal";
import { Tenant } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { tenantService } from "@/services/TenantService";
import { Button } from "@/components/ui/button";
import { Building, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Tenants = () => {
  const { userRole } = useAuth();
  const isMobile = useIsMobile();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 [DEFINITIVE] Loading tenants directly...');

        console.log('📋 Loading tenants from Supabase...');
        const loadedTenants = await tenantService.getTenants();
        console.log(`✅ Loaded ${loadedTenants.length} tenants:`, loadedTenants);
        setTenants(loadedTenants);
      } catch (error) {
        console.error("❌ Error loading tenants:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Error al cargar los datos de inquilinos: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadTenants();
  }, []);

  const handleAddTenant = () => {
    if (userRole === 'landlord_free' && tenants.length >= 3) {
      toast.error("Los usuarios gratuitos pueden tener máximo 3 inquilinos. Actualiza a Premium para inquilinos ilimitados");
      return;
    }
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
      toast.success(`Inquilino ${tenant.name} eliminado exitosamente`);
    } catch (error) {
      console.error("Error removing tenant:", error);
      toast.error("Error al eliminar el inquilino");
    }
  };

  const handleSaveTenant = async (updatedTenant: Tenant) => {
    try {
      console.log('💾 Starting save operation for tenant:', updatedTenant);

      if (currentTenant) {
        console.log('🔄 Updating existing tenant:', currentTenant.id);
        const result = await tenantService.updateTenant(updatedTenant.id, updatedTenant);
        console.log('✅ Update result:', result);
        toast.success("Inquilino actualizado exitosamente");
      } else {
        console.log('➕ Creating new tenant');
        const result = await tenantService.createTenant(updatedTenant);
        console.log('✅ Create result:', result);
        toast.success("Inquilino agregado exitosamente");
      }

      // Refresh the tenant list to show updated data
      console.log('🔄 Refreshing tenant list after save...');
      const refreshedTenants = await tenantService.getTenants();
      console.log('📋 Refreshed tenants:', refreshedTenants);
      setTenants(refreshedTenants);

      setIsEditModalOpen(false);
    } catch (error) {
      console.error("❌ Error saving tenant:", error);
      console.error("❌ Error details:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Error al guardar el inquilino: ${errorMessage}`);
    }
  };


  return (
    <Layout>
      <div className={`space-y-6 ${isMobile ? 'px-2' : ''}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
          <div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-semibold tracking-tight`}>Inquilinos</h1>
            <p className="text-muted-foreground">Gestiona tus inquilinos y sus pagos</p>
          </div>
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
            <Button
              variant="outline"
              onClick={() => {
                // Create a file input element
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.xlsx,.xls';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    toast.info("Función de importación en desarrollo. Por ahora, agrega inquilinos manualmente.");
                  }
                };
                input.click();
              }}
              className="gap-2"
              size={isMobile ? "sm" : "default"}
            >
              <Building className="h-4 w-4" />
              Importar Datos
            </Button>
            <Button onClick={handleAddTenant} className="gap-2" size={isMobile ? "sm" : "default"}>
              <Plus className="h-4 w-4" />
              Agregar Inquilino
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <TenantsTable
              tenants={tenants}
              onEditTenant={handleEditTenant}
              onDeleteTenant={handleDeleteTenant}
            />
            
            {/* Tarjetas de inquilinos debajo de la tabla */}
            <TenantCards
              tenants={tenants}
              onEditTenant={handleEditTenant}
              onDeleteTenant={handleDeleteTenant}
            />
          </>
        )}

        <TenantEditForm
          tenant={currentTenant}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveTenant}
        />

        {/* TODO: Implement UnitManagementModal */}
      </div>
    </Layout>
  );
};

export default Tenants;

