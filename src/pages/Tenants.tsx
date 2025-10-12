

import { Layout } from "@/components/Layout";
import { TenantsTable } from "@/components/tenants/TenantsTable";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
// import { UnitManagementModal } from "@/components/units/UnitManagementModal";
import { TenantPaymentTracker } from "@/components/payments/TenantPaymentTracker";
import { Tenant, TenantStatus } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { tenantService } from "@/services/TenantService";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, AlertTriangle, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Tenants = () => {
  const { userRole } = useAuth();
  const isMobile = useIsMobile();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setIsLoading(true);
        console.log('Loading tenants from Supabase...');
        const loadedTenants = await tenantService.getTenants();
        console.log(`Loaded ${loadedTenants.length} tenants`);
        setTenants(loadedTenants);
      } catch (error) {
        console.error("Error loading tenants:", error);
        toast.error("Error al cargar los datos de inquilinos");
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
      if (currentTenant) {
        await tenantService.updateTenant(updatedTenant.id, updatedTenant);
        toast.success("Inquilino actualizado exitosamente");
      } else {
        await tenantService.createTenant(updatedTenant);
        toast.success("Inquilino agregado exitosamente");
      }
      
      // Refresh the tenant list to show updated data
      console.log('🔄 Refreshing tenant list after save...');
      const refreshedTenants = await tenantService.getTenants();
      setTenants(refreshedTenants);
      
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
          <div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-semibold tracking-tight`}>Inquilinos</h1>
            <p className="text-muted-foreground">Gestiona tus inquilinos y sus pagos</p>
          </div>
          <Button onClick={handleAddTenant} className="gap-2" size={isMobile ? "sm" : "default"}>
            <Plus className="h-4 w-4" />
            Agregar Inquilino
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <TenantsTable
            tenants={tenants}
            onEditTenant={handleEditTenant}
            onDeleteTenant={handleDeleteTenant}
          />
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

