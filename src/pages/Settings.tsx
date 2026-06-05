import { Layout } from "@/components/Layout";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { DataSettings } from "@/components/settings/DataSettings";
import StripeSettings from "@/components/settings/StripeSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/contexts/i18nContext";

const Settings = () => {
  const { t } = useI18n();

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t.settings.title}</h1>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">{t.settings.account}</TabsTrigger>
            <TabsTrigger value="stripe">{t.settings.stripe}</TabsTrigger>
            <TabsTrigger value="theme">{t.settings.theme}</TabsTrigger>
            <TabsTrigger value="language">{t.settings.language}</TabsTrigger>
            <TabsTrigger value="data">{t.settings.data}</TabsTrigger>
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

          <TabsContent value="data">
            <DataSettings />
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Settings;
