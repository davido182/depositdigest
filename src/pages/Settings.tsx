
import { Layout } from "@/components/Layout";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { DataSettings } from "@/components/settings/DataSettings";
import { MobileFeatureToggle } from "@/components/settings/MobileFeatureToggle";
import StripeSettings from "@/components/settings/StripeSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
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
            <MobileFeatureToggle />
          </TabsContent>
          
          <TabsContent value="data">
            <DataSettings />
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Settings;
