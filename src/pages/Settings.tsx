
import { Layout } from "@/components/Layout";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { DataSettings } from "@/components/settings/DataSettings";
import { MobileFeatureToggle } from "@/components/settings/MobileFeatureToggle";
import StripeSettings from "@/components/settings/StripeSettings";
import { LiveUpdatesStatus } from "@/components/LiveUpdatesStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";



const Settings = () => {
  const { userRole, user, refreshUserRole } = useAuth();

  const handleUpgradeToPremium = async () => {
    try {
      console.log('Creating checkout session...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: 'price_1QdFz0DKXqPjJWpJqwgNLYkr'
        }
      });

      if (error) {
        console.error('Stripe function error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Opening checkout URL:', data.url);
        window.open(data.url, '_blank');
      } else {
        throw new Error('No se recibió URL de checkout');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Error al crear sesión de pago. Verifica tu configuración de Stripe.');
    }
  };
  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
          {userRole === 'landlord_free' && (
            <Button onClick={handleUpgradeToPremium} className="gap-2">
              <Crown className="h-4 w-4" />
              Actualizar a Premium
            </Button>
          )}
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="account">Cuenta</TabsTrigger>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
            <TabsTrigger value="theme">Tema</TabsTrigger>
            <TabsTrigger value="language">Idioma</TabsTrigger>
            <TabsTrigger value="mobile">Móvil</TabsTrigger>
            <TabsTrigger value="data">Datos</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="stripe">
            <StripeSettings />
          </TabsContent>

          <TabsContent value="theme">
            <ThemeSettings />
          </TabsContent>

          <TabsContent value="language">
            <LanguageSettings />
          </TabsContent>

          <TabsContent value="mobile">
            <div className="space-y-6">
              <MobileFeatureToggle />
              <LiveUpdatesStatus />
            </div>
          </TabsContent>

          <TabsContent value="data">
            <DataSettings />

            {/* Debug button temporal */}
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">🔧 Debug user_roles</h3>
              <p className="text-sm text-muted-foreground mb-2">
                User ID: {user?.id}<br />
                Current Role: {userRole}
              </p>
              <Button
                onClick={async () => {
                  if (user) {
                    console.log("🔄 Manual role refresh triggered for:", user.id);
                    try {
                      await refreshUserRole(user);
                      toast.success("Role refresh completed - check console");
                    } catch (error) {
                      console.error("Error refreshing role:", error);
                      toast.error("Error refreshing role");
                    }
                  }
                }}
                variant="outline"
                size="sm"
              >
                🔄 Force Role Creation
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Settings;
