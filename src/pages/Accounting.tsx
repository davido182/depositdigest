
import { Layout } from "@/components/Layout";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";

const Accounting = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Contabilidad</h1>
            <p className="text-muted-foreground">
              Gestiona tus asientos contables, cuentas e impuestos
            </p>
          </div>
        </div>
        <AccountingDashboard />
      </section>
    </Layout>
  );
};

export default Accounting;
