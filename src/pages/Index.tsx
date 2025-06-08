
import { Layout } from "@/components/Layout";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { TenantsGrid } from "@/components/dashboard/TenantsGrid";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import { UnitManagementModal } from "@/components/units/UnitManagementModal";
import { Payment, Tenant } from "@/types";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DatabaseService from "@/services/DatabaseService";
import { Button } from "@/components/ui/button";
import { Building, Plus } from "lucide-react";

const Index = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUnits, setTotalUnits] = useState(9); // Valor por defecto a 9

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dbService = DatabaseService.getInstance();
        
        // Cargar la configuración guardada de unidades primero
        const savedUnits = dbService.getTotalUnits();
        setTotalUnits(savedUnits);
        
        const loadedTenants = await dbService.getTenants();
        const loadedPayments = await dbService.getPayments();
        
        console.log(`Dashboard: Loaded ${loadedTenants.length} tenants`);
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

  const handleAddPayment = () => {
    const paymentForm = document.createElement('a');
    paymentForm.href = '/payments';
    paymentForm.click();
  };

  const handleUpdatePayment = async (payment: Payment) => {
    try {
      const dbService = DatabaseService.getInstance();
      
      const existingPayment = payments.find(p => p.id === payment.id);
      
      if (existingPayment) {
        await dbService.updatePayment(payment.id, payment);
      } else {
        await dbService.createPayment(payment);
      }
      
      const loadedPayments = await dbService.getPayments();
      setPayments(loadedPayments);
      toast.success("Payment updated successfully");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    }
  };

  // Calcular estadísticas basadas en el total de unidades configurado
  const activeTenants = tenants.filter(t => t.status === 'active');
  const occupiedUnits = activeTenants.length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-1.5"
              onClick={() => setIsUnitModalOpen(true)}
            >
              <Building className="h-4 w-4" />
              <span>Manage Units ({totalUnits})</span>
            </Button>
            <Button onClick={handleAddTenant} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Tenant
            </Button>
          </div>
        </div>
        
        <DashboardSummary stats={{
          totalUnits: totalUnits,
          occupiedUnits: occupiedUnits,
          vacantUnits: vacantUnits,
          occupancyRate: occupancyRate,
          totalTenants: tenants.length,
          monthlyRevenue: tenants.reduce((sum, tenant) => sum + tenant.rentAmount, 0),
          overduePayments: tenants.filter(t => t.status === 'late').length,
          pendingDeposits: payments.filter(p => p.status === 'pending' && p.type === 'deposit').length,
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
          {isLoading ? (
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
        <TabsContent value="payments" className="mt-2">
          <PaymentsList
            payments={payments}
            tenants={tenants}
            tenantNames={tenantNames}
            onAddPayment={handleAddPayment}
            onUpdatePayment={handleUpdatePayment}
          />
        </TabsContent>
      </Tabs>

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
    </Layout>
  );
};

export default Index;
