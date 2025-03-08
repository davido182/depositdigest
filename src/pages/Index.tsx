
import { Layout } from "@/components/Layout";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { TenantList } from "@/components/tenants/TenantList";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import { Payment, Tenant } from "@/types";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DatabaseService from "@/services/DatabaseService";

const Index = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dbService = DatabaseService.getInstance();
        const loadedTenants = await dbService.getTenants();
        const loadedPayments = await dbService.getPayments();
        
        setTenants(loadedTenants);
        setPayments(loadedPayments);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Create a map of tenant IDs to names for the payments list
  const tenantNames = tenants.reduce(
    (acc, tenant) => {
      acc[tenant.id] = tenant.name;
      return acc;
    },
    {} as Record<string, string>
  );

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
    }
  };

  const handleAddPayment = () => {
    toast.info("Add payment feature coming soon");
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <DashboardSummary stats={{
          totalUnits: 20,
          occupiedUnits: tenants.filter(t => t.status === 'active').length,
          vacantUnits: 20 - tenants.filter(t => t.status === 'active').length,
          occupancyRate: Math.round((tenants.filter(t => t.status === 'active').length / 20) * 100),
          totalTenants: tenants.length,
          monthlyRevenue: tenants.reduce((sum, tenant) => sum + tenant.rentAmount, 0),
          overduePayments: tenants.filter(t => t.status === 'late').length,
          pendingDeposits: 1,
          upcomingMoveIns: 1,
          upcomingMoveOuts: tenants.filter(t => t.status === 'notice').length,
        }} />
      </section>

      <Tabs defaultValue="tenants" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="tenants" className="mt-2">
          <TenantList
            tenants={tenants}
            onAddTenant={handleAddTenant}
            onEditTenant={handleEditTenant}
          />
        </TabsContent>
        <TabsContent value="payments" className="mt-2">
          <PaymentsList
            payments={payments}
            tenantNames={tenantNames}
            onAddPayment={handleAddPayment}
          />
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
