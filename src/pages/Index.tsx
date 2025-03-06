
import { Layout } from "@/components/Layout";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { TenantList } from "@/components/tenants/TenantList";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { Payment, Tenant } from "@/types";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";

// Mock data
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
    status: "active",
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
    status: "active",
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
    status: "late",
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
    status: "notice",
    paymentHistory: [],
    createdAt: "2023-02-10",
    updatedAt: "2023-02-10",
  },
];

const mockPayments: Payment[] = [
  {
    id: "p1",
    tenantId: "1",
    amount: 1500,
    date: "2023-08-01",
    type: "rent",
    method: "transfer",
    status: "completed",
    createdAt: "2023-08-01",
  },
  {
    id: "p2",
    tenantId: "2",
    amount: 1700,
    date: "2023-08-02",
    type: "rent",
    method: "card",
    status: "completed",
    createdAt: "2023-08-02",
  },
  {
    id: "p3",
    tenantId: "3",
    amount: 1600,
    date: "2023-07-28",
    type: "rent",
    method: "transfer",
    status: "pending",
    createdAt: "2023-07-28",
  },
  {
    id: "p4",
    tenantId: "4",
    amount: 1800,
    date: "2023-08-01",
    type: "rent",
    method: "check",
    status: "completed",
    createdAt: "2023-08-01",
  },
  {
    id: "p5",
    tenantId: "1",
    amount: 75,
    date: "2023-07-15",
    type: "fee",
    method: "cash",
    status: "completed",
    createdAt: "2023-07-15",
  },
];

// Dashboard stats
const dashboardStats = {
  totalUnits: 20,
  occupiedUnits: 17,
  vacantUnits: 3,
  occupancyRate: 85,
  totalTenants: 17,
  monthlyRevenue: 28000,
  overduePayments: 2,
  pendingDeposits: 1,
  upcomingMoveIns: 1,
  upcomingMoveOuts: 2,
};

const Index = () => {
  const [tenants] = useState<Tenant[]>(mockTenants);
  const [payments] = useState<Payment[]>(mockPayments);

  // Create a map of tenant IDs to names for the payments list
  const tenantNames = tenants.reduce(
    (acc, tenant) => {
      acc[tenant.id] = tenant.name;
      return acc;
    },
    {} as Record<string, string>
  );

  const handleAddTenant = () => {
    toast.info("Add tenant feature coming soon");
  };

  const handleEditTenant = (tenant: Tenant) => {
    toast.info(`Edit tenant: ${tenant.name}`);
  };

  const handleAddPayment = () => {
    toast.info("Add payment feature coming soon");
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <DashboardSummary stats={dashboardStats} />
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
    </Layout>
  );
};

export default Index;
