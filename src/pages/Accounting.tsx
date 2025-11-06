
import { Layout } from "@/components/Layout";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";

const Accounting = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight"> [DEMO] Contabilidad - (Sección en desarrollo)</h1>
        </div>
        <AccountingDashboard />
      </section>
    </Layout>
  );
};

export default Accounting;
