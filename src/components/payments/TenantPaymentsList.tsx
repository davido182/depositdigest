import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  notes?: string;
}

const TenantPaymentsList = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextPaymentDue, setNextPaymentDue] = useState<Date | null>(null);
  const [rentAmount, setRentAmount] = useState<number>(0);

  useEffect(() => {
    const loadPayments = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get tenant info to get rent amount
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('rent_amount, lease_start_date')
          .eq('email', user.email)
          .single();

        if (tenantError) {
          console.error("Error loading tenant info:", tenantError);
          return;
        }

        setRentAmount(tenant.rent_amount);

        // Calculate next payment due (assuming monthly payments)
        const today = new Date();
        const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        setNextPaymentDue(nextDue);

        // Get payment history
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('tenant_id', user.id)
          .order('payment_date', { ascending: false });

        if (paymentsError) {
          console.error("Error loading payments:", paymentsError);
          toast.error("Error al cargar historial de pagos");
          return;
        }

        setPayments(paymentsData || []);
      } catch (error) {
        console.error("Error loading payment data:", error);
        toast.error("Error al cargar información de pagos");
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, [user]);

  const handlePayRent = async () => {
    try {
      // This would typically integrate with a payment processor
      toast.info("Redirigiéndote al sistema de pagos...");
      // Here you would integrate with Stripe, PayPal, or other payment system
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error al procesar el pago");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Payment Due */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Clock className="h-5 w-5" />
            Próximo Pago de Renta
          </CardTitle>
          <CardDescription className="text-blue-600">
            {nextPaymentDue && `Vence el ${nextPaymentDue.toLocaleDateString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-blue-800">${rentAmount}</p>
              <p className="text-sm text-blue-600">Renta mensual</p>
            </div>
            <Button onClick={handlePayRent} className="bg-blue-600 hover:bg-blue-700">
              <CreditCard className="h-4 w-4 mr-2" />
              Pagar Ahora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Historial de Pagos
          </CardTitle>
          <CardDescription>
            Tus pagos de renta realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay pagos registrados aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">${payment.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()} - {payment.payment_method}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantPaymentsList;