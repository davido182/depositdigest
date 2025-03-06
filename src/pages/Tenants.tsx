
import { Layout } from "@/components/Layout";
import { TenantList } from "@/components/tenants/TenantList";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import { Tenant } from "@/types";
import { useState } from "react";
import { toast } from "sonner";

// Mock data - we're using the same data as in Index for now
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

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  const handleAddTenant = () => {
    setCurrentTenant(null);
    setIsEditModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setIsEditModalOpen(true);
  };

  const handleSaveTenant = (updatedTenant: Tenant) => {
    if (currentTenant) {
      // Update existing tenant
      setTenants(
        tenants.map((t) => (t.id === updatedTenant.id ? updatedTenant : t))
      );
    } else {
      // Add new tenant
      setTenants([...tenants, updatedTenant]);
    }
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Tenants</h1>
        <TenantList
          tenants={tenants}
          onAddTenant={handleAddTenant}
          onEditTenant={handleEditTenant}
        />
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
