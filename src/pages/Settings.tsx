
import { Layout } from "@/components/Layout";
import { MobileFeatureToggle } from "@/components/settings/MobileFeatureToggle";

const Settings = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        </div>
        
        <div className="grid gap-6">
          <MobileFeatureToggle />
        </div>
      </section>
    </Layout>
  );
};

export default Settings;
