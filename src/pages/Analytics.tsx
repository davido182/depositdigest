
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";

const Analytics = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              This feature is coming soon. Here you will be able to view analytics and insights about your rental properties.
            </p>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Analytics;
