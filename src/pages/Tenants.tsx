
import { Layout } from "@/components/Layout";
import { TenantList } from "@/components/tenants/TenantList";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import { Tenant, TenantStatus } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import DatabaseService from "@/services/DatabaseService";

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const dbService = DatabaseService.getInstance();
        const isConnected = await dbService.testConnection();
        
        if (isConnected) {
          const loadedTenants = await dbService.getTenants();
          setTenants(loadedTenants);
          setIsOffline(false);
        } else {
          setIsOffline(true);
          const mockTenants: Tenant[] = [
            {
              id: "1",
              name: "Alex Johnson",
              email: "alex.johnson@example.com",
              phone: "(555) 123-4567",
              unit: "101",
              moveInDate: "2023-01-15",
              leaseEndDate: "2024-01-15",
              rentAmount: 1500,
              depositAmount: 1500,
              status: "active" as TenantStatus,
              paymentHistory: [],
              createdAt: "2023-01-10",
              updatedAt: "2023-01-10",
            },
            {
              id: "2",
              name: "Sarah Williams",
              email: "sarah.williams@example.com",
              phone: "(555) 987-6543",
              unit: "205",
              moveInDate: "2023-03-01",
              leaseEndDate: "2024-03-01",
              rentAmount: 1700,
              depositAmount: 1700,
              status: "active" as TenantStatus,
              paymentHistory: [],
              createdAt: "2023-02-25",
              updatedAt: "2023-02-25",
            },
            {
              id: "3",
              name: "Michael Chen",
              email: "michael.chen@example.com",
              phone: "(555) 456-7890",
              unit: "310",
              moveInDate: "2022-11-01",
              leaseEndDate: "2023-11-01",
              rentAmount: 1600,
              depositAmount: 1600,
              status: "late" as TenantStatus,
              paymentHistory: [],
              createdAt: "2022-10-25",
              updatedAt: "2022-10-25",
            },
            {
              id: "4",
              name: "Jessica Rodriguez",
              email: "jessica.rodriguez@example.com",
              phone: "(555) 789-0123",
              unit: "402",
              moveInDate: "2023-02-15",
              leaseEndDate: "2024-02-15",
              rentAmount: 1800,
              depositAmount: 1800,
              status: "notice" as TenantStatus,
              paymentHistory: [],
              createdAt: "2023-02-10",
              updatedAt: "2023-02-10",
            },
          ];
          setTenants(mockTenants);
          toast.warning("Using offline mode with mock data");
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

  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Tenants</h1>
          {isOffline && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm">
              Offline Mode
            </div>
          )}
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
          />
        )}
        <TenantEditForm
          tenant={currentTenant}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveTenant}
        />
      </section>
    </Layout>
  );
};

export default Tenants;
