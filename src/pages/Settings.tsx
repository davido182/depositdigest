
import { Layout } from "@/components/Layout";
import { MobileFeatureToggle } from "@/components/settings/MobileFeatureToggle";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { DataSettings } from "@/components/settings/DataSettings";

const Settings = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        </div>
        
        <div className="grid gap-6">
          <DataSettings />
          <AccountSettings />
          <ThemeSettings />
          <LanguageSettings />
          <MobileFeatureToggle />
        </div>
      </section>
    </Layout>
  );
};

export default Settings;
