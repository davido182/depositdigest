
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Check subscription status after successful payment
    const updateSubscription = async () => {
      try {
        await checkSubscription();
        toast.success("¡Bienvenido a RentFlow Premium!");
      } catch (error) {
        console.error("Error updating subscription:", error);
      }
    };

    updateSubscription();
  }, [checkSubscription]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              ¡Pago Exitoso!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-purple-700">
              <Crown className="w-5 h-5" />
              <span>Ahora eres Premium</span>
            </div>
            
            <p className="text-muted-foreground">
              Tu suscripción a RentFlow Premium se ha activado correctamente. 
              Ahora tienes acceso a todas las funciones premium.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold text-blue-900 mb-2">
                Funciones Premium Desbloqueadas:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Módulo de Contabilidad completo</li>
                <li>• Asistente IA especializado</li>
                <li>• Reportes avanzados</li>
                <li>• Soporte prioritario</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
                size="lg"
              >
                Ir al Dashboard
              </Button>
              <Button 
                onClick={() => navigate('/accounting')} 
                variant="outline" 
                className="w-full"
              >
                Explorar Contabilidad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
