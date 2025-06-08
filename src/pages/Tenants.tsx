import { Layout } from "@/components/Layout";
import { TenantList } from "@/components/tenants/TenantList";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import { UnitManagementModal } from "@/components/units/UnitManagementModal";
import { Tenant, TenantStatus } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import DatabaseService from "@/services/DatabaseService";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [totalUnits, setTotalUnits] = useState(20);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setIsLoading(true);
        const dbService = DatabaseService.getInstance();
        const isConnected = await dbService.testConnection();
        
        if (isConnected) {
          console.log('Loading tenants from database service');
          const loadedTenants = await dbService.getTenants();
          console.log(`Loaded ${loadedTenants.length} tenants`);
          setTenants(loadedTenants);
          
          // Load saved unit count
          const savedUnits = dbService.getTotalUnits();
          setTotalUnits(savedUnits);
          setIsOffline(false);
        } else {
          setIsOffline(true);
          toast.warning("Using offline mode");
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
        toast.error("Failed to load tenants data");
        setIsOffline(true);
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
      const dbService = DatabaseService.getInstance();
      const success = await dbService.deleteTenant(tenant.id);
      
      if (success) {
        setTenants(tenants.filter(t => t.id !== tenant.id));
        toast.success(`Tenant ${tenant.name} removed successfully`);
      } else {
        toast.error("Failed to remove tenant");
      }
    } catch (error) {
      console.error("Error removing tenant:", error);
      toast.error("Failed to remove tenant");
      
      if (isOffline) {
        setTenants(tenants.filter(t => t.id !== tenant.id));
        toast.info("Tenant removed in offline mode");
      }
    }
  };

  const handleSaveTenant = async (updatedTenant: Tenant) => {
    try {
      const dbService = DatabaseService.getInstance();
      
      if (currentTenant) {
        await dbService.updateTenant(updatedTenant.id, updatedTenant);
        setTenants(
          tenants.map((t) => (t.id === updatedTenant.id ? updatedTenant : t))
        );
        toast.success("Tenant updated successfully");
      } else {
        const newId = await dbService.createTenant(updatedTenant);
        const newTenant = { ...updatedTenant, id: newId };
        setTenants([...tenants, newTenant]);
        toast.success("Tenant added successfully");
      }
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error saving tenant:", error);
      toast.error("Failed to save tenant");
      
      if (isOffline) {
        if (currentTenant) {
          setTenants(
            tenants.map((t) => (t.id === updatedTenant.id ? updatedTenant : t))
          );
        } else {
          const mockId = Math.random().toString(36).substring(2, 15);
          const newTenant = { 
            ...updatedTenant, 
            id: mockId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setTenants([...tenants, newTenant as Tenant]);
        }
        setIsEditModalOpen(false);
        toast.info("Changes saved in offline mode");
      }
    }
  };
  
  const handleUpdateUnitCount = (newCount: number) => {
    try {
      const dbService = DatabaseService.getInstance();
      dbService.setTotalUnits(newCount);
      setTotalUnits(newCount);
      toast.success(`Property updated to ${newCount} units`);
      setIsUnitModalOpen(false);
    } catch (error) {
      console.error("Error updating unit count:", error);
      toast.error("Failed to update unit count");
    }
  };

  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Tenants</h1>
          <div className="flex gap-2">
            {isOffline && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm">
                Offline Mode
              </div>
            )}
            <Button 
              variant="outline" 
              className="gap-1.5"
              onClick={() => setIsUnitModalOpen(true)}
            >
              <Building className="h-4 w-4" />
              <span>Manage Units ({totalUnits})</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <TenantList
            tenants={tenants}
            onAddTenant={handleAddTenant}
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
        
        <UnitManagementModal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          currentUnitCount={totalUnits}
          onSave={handleUpdateUnitCount}
        />
      </section>
    </Layout>
  );
};

export default Tenants;
