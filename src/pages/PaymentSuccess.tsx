import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Receipt, Home } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // Payment was successful
      toast.success("¡Pago procesado exitosamente!");
      setIsLoading(false);
    } else {
      // No session ID found
      toast.error("Sesión de pago no válida");
      setIsLoading(false);
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">¡Pago Exitoso!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              Tu pago de renta ha sido procesado correctamente. Recibirás un comprobante por email.
            </p>
            
            {sessionId && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">ID de transacción:</p>
                <p className="font-mono text-sm">{sessionId}</p>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => navigate('/tenant-dashboard')} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/payments')} className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Ver Historial de Pagos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;