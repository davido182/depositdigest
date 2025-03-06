
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";

const Reports = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Reports Dashboard</h2>
            <p className="text-muted-foreground">
              This feature is coming soon. Here you will be able to generate and view reports about your properties, tenants, and financials.
            </p>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Reports;
