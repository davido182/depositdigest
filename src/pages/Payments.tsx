
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

  const handleUpdatePayment = async (payment: Payment) => {
    try {
      const dbService = DatabaseService.getInstance();
      
      // Check if this is a new payment or existing one
      const existingPayment = payments.find(p => p.id === payment.id);
      
      if (existingPayment) {
        // Update existing payment
        await dbService.updatePayment(payment.id, payment);
        
        // Update local state without a full reload
        setPayments(currentPayments => 
          currentPayments.map(p => p.id === payment.id ? payment : p)
        );
        
        toast.success("Payment updated successfully");
      } else {
        // Create new payment
        await dbService.createPayment(payment);
        
        // Add to local state without a full reload
        setPayments(currentPayments => [...currentPayments, payment]);
        
        toast.success("Payment added successfully");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
      // Reload data if operation failed to ensure UI is in sync
      await loadData();
    }
  };
  
  const handleDeletePayment = async (paymentId: string) => {
    try {
      const dbService = DatabaseService.getInstance();
      const success = await dbService.deletePayment(paymentId);
      
      if (success) {
        // Update local state without a full reload
        setPayments(currentPayments => 
          currentPayments.filter(p => p.id !== paymentId)
        );
        
        toast.success("Payment deleted successfully");
      } else {
        toast.error("Failed to delete payment");
        // Reload data to ensure UI is in sync
        await loadData();
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
      // Reload data if operation failed to ensure UI is in sync
      await loadData();
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
            onAddPayment={loadData}
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
          />
        )}
      </section>
    </Layout>
  );
};

export default Payments;
