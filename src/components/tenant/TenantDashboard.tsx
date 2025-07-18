import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Calendar, CreditCard, MapPin, Phone, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TenantInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  unit_number: string;
  rent_amount: number;
  lease_start_date: string;
  lease_end_date: string | null;
  status: string;
  landlord_id: string;
}

const TenantDashboard = () => {
  const { user } = useAuth();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenantInfo = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get tenant information based on current user
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error("Error loading tenant info:", error);
          toast.error("Error al cargar información del inquilino");
          return;
        }

        setTenantInfo(tenant);
      } catch (error) {
        console.error("Error loading tenant info:", error);
        toast.error("Error al cargar información del inquilino");
      } finally {
        setIsLoading(false);
      }
    };

    loadTenantInfo();
  }, [user]);

  const handlePayRent = async () => {
    try {
      if (!tenantInfo) {
        toast.error("Información del inquilino no disponible");
        return;
      }

      // Create payment session with Stripe
      const { data, error } = await supabase.functions.invoke('create-tenant-payment', {
        body: {
          tenantId: tenantInfo.id,
          amount: tenantInfo.rent_amount,
          description: `Pago de renta - Unidad ${tenantInfo.unit_number}`
        }
      });

      if (error) {
        console.error("Error creating payment session:", error);
        toast.error("Error al crear sesión de pago");
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast.success("Redirigiendo a página de pago...");
      } else {
        toast.error("No se pudo crear la sesión de pago");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error al procesar el pago");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!tenantInfo) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Información no encontrada</h3>
          <p className="text-gray-500">No se pudo encontrar información del inquilino para esta cuenta.</p>
        </div>
      </Layout>
    );
  }

  const leaseEndDate = tenantInfo.lease_end_date ? new Date(tenantInfo.lease_end_date) : null;
  const daysUntilLeaseEnd = leaseEndDate ? Math.ceil((leaseEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Mi Unidad</h1>
            <p className="text-muted-foreground">Información de tu alquiler</p>
          </div>
          <Badge 
            variant={tenantInfo.status === 'active' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {tenantInfo.status === 'active' ? 'Activo' : tenantInfo.status}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Unit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información de la Unidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Unidad {tenantInfo.unit_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Renta mensual: <span className="font-medium">${tenantInfo.rent_amount}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Inicio de contrato: <span className="font-medium">{new Date(tenantInfo.lease_start_date).toLocaleDateString()}</span></span>
              </div>
              {leaseEndDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Fin de contrato: <span className="font-medium">{leaseEndDate.toLocaleDateString()}</span></span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{tenantInfo.email}</span>
              </div>
              {tenantInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{tenantInfo.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lease Status */}
          {daysUntilLeaseEnd !== null && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Estado del Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                {daysUntilLeaseEnd > 30 ? (
                  <div className="text-green-600">
                    <p>Tu contrato está vigente por {daysUntilLeaseEnd} días más.</p>
                  </div>
                ) : daysUntilLeaseEnd > 0 ? (
                  <div className="text-yellow-600">
                    <p>⚠️ Tu contrato vence en {daysUntilLeaseEnd} días. Contacta a tu propietario para renovar.</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <p>🔴 Tu contrato ha vencido. Contacta a tu propietario inmediatamente.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Gestiona tu alquiler fácilmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <Button onClick={handlePayRent} className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagar Renta Mensual
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/maintenance'}>
                  Reportar Mantenimiento
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/payments'}>
                  Ver Historial de Pagos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TenantDashboard;