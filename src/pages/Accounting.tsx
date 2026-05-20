
import { Layout } from "@/components/Layout";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";

const Accounting = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Contabilidad</h1>
          <p className="text-muted-foreground text-sm">
            Sección en desarrollo.{" "}
            Para obtener esta sección{" "}
            <a
              href="/landing#contacto"
              className="text-blue-600 hover:underline font-medium"
            >
              consulta nuestros precios
            </a>
            .
          </p>
        </div>
        <AccountingDashboard />
      </section>
    </Layout>
  );
};

export default Accounting;
