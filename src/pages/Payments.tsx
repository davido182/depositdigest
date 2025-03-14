
import { Layout } from "@/components/Layout";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { Payment, Tenant } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import DatabaseService from "@/services/DatabaseService";

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load payments and tenants on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dbService = DatabaseService.getInstance();
      const [loadedPayments, loadedTenants] = await Promise.all([
        dbService.getPayments(),
        dbService.getTenants()
      ]);
      
      setPayments(loadedPayments);
      setTenants(loadedTenants);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  };

  // Create a map of tenant IDs to names for the payments list
  const tenantNames = tenants.reduce(
    (acc, tenant) => {
      acc[tenant.id] = tenant.name;
      return acc;
    },
    {} as Record<string, string>
  );

  const handleAddPayment = async () => {
    await loadData();
    toast.success("Payment added successfully");
  };
  
  const handleUpdatePayment = async (payment: Payment) => {
    try {
      const dbService = DatabaseService.getInstance();
      
      // Check if this is a new payment or existing one
      const existingPayment = payments.find(p => p.id === payment.id);
      
      if (existingPayment) {
        // Update existing payment
        await dbService.updatePayment(payment.id, payment);
        toast.success("Payment updated successfully");
      } else {
        // Create new payment
        await dbService.createPayment(payment);
        toast.success("Payment added successfully");
      }
      
      // Reload payments
      await loadData();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    }
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="text-center text-muted-foreground">Loading payments...</div>
          </div>
        ) : (
          <PaymentsList
            payments={payments}
            tenants={tenants}
            tenantNames={tenantNames}
            onAddPayment={handleAddPayment}
            onUpdatePayment={handleUpdatePayment}
          />
        )}
      </section>
    </Layout>
  );
};

export default Payments;
