import { Layout } from "@/components/Layout";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { ReceiptProcessor } from "@/components/payments/ReceiptProcessor";
import { Payment, Tenant } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DatabaseService } from "@/services/DatabaseService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar pagos e inquilinos al montar el componente
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
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar pagos");
    } finally {
      setIsLoading(false);
    }
  };

  // Crear un mapa de IDs de inquilinos a nombres para la lista de pagos
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
      
      // Verificar si es un pago nuevo o existente
      const existingPayment = payments.find(p => p.id === payment.id);
      
      if (existingPayment) {
        // Actualizar pago existente
        await dbService.updatePayment(payment.id, payment);
        
        // Actualizar estado local sin recargar completamente
        setPayments(currentPayments => 
          currentPayments.map(p => p.id === payment.id ? payment : p)
        );
        
        toast.success("Pago actualizado exitosamente");
      } else {
        // Crear nuevo pago
        await dbService.createPayment(payment);
        
        // Agregar al estado local sin recargar completamente
        setPayments(currentPayments => [...currentPayments, payment]);
        
        toast.success("Pago agregado exitosamente");
      }
    } catch (error) {
      console.error("Error al actualizar pago:", error);
      toast.error("Error al actualizar pago");
      // Recargar datos si la operación falló para asegurar que la UI esté sincronizada
      await loadData();
    }
  };
  
  const handleDeletePayment = async (paymentId: string) => {
    try {
      const dbService = DatabaseService.getInstance();
      const success = await dbService.deletePayment(paymentId);
      
      if (success) {
        // Actualizar estado local sin recargar completamente
        setPayments(currentPayments => 
          currentPayments.filter(p => p.id !== paymentId)
        );
        
        toast.success("Pago eliminado exitosamente");
      } else {
        toast.error("Error al eliminar pago");
        // Recargar datos para asegurar que la UI esté sincronizada
        await loadData();
      }
    } catch (error) {
      console.error("Error al eliminar pago:", error);
      toast.error("Error al eliminar pago");
      // Recargar datos si la operación falló para asegurar que la UI esté sincronizada
      await loadData();
    }
  };

  const handleReceiptPaymentCreated = (payment: Payment) => {
    handleUpdatePayment(payment);
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Pagos</h1>
        
        <Tabs defaultValue="payments" className="w-full">
          <TabsList>
            <TabsTrigger value="payments">Lista de Pagos</TabsTrigger>
            <TabsTrigger value="processor">Procesar Comprobantes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="text-center text-muted-foreground">Cargando pagos...</div>
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
          </TabsContent>
          
          <TabsContent value="processor">
            <ReceiptProcessor
              tenants={tenants}
              onPaymentCreated={handleReceiptPaymentCreated}
            />
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Payments;
