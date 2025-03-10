
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import DatabaseService from "@/services/DatabaseService";
import { Tenant, Payment } from "@/types";
import { AreaChart, BarChart, PieChart } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Analytics = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dbService = DatabaseService.getInstance();
        const loadedTenants = await dbService.getTenants();
        const loadedPayments = await dbService.getPayments();
        const units = dbService.getTotalUnits();
        
        setTenants(loadedTenants);
        setPayments(loadedPayments);
        setTotalUnits(units);
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate relevant KPIs
  const activeTenants = tenants.filter(t => t.status === 'active');
  const occupiedUnits = activeTenants.length;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  
  const monthlyRevenue = tenants.reduce((sum, tenant) => sum + tenant.rentAmount, 0);
  const collectedRevenue = payments
    .filter(p => p.status === 'completed' && p.type === 'rent')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const collectionRate = monthlyRevenue > 0 ? (collectedRevenue / monthlyRevenue) * 100 : 0;
  
  // Calculate tenant status breakdown
  const statusCount = {
    active: tenants.filter(t => t.status === 'active').length,
    late: tenants.filter(t => t.status === 'late').length,
    notice: tenants.filter(t => t.status === 'notice').length,
    inactive: tenants.filter(t => t.status === 'inactive').length,
  };
  
  // Payment method breakdown
  const paymentMethods = payments.reduce((acc, payment) => {
    acc[payment.method] = (acc[payment.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Generate demo data for trends (in a real app, this would come from historical data)
  const occupancyTrend = [
    { month: 'Jan', rate: 75 },
    { month: 'Feb', rate: 78 },
    { month: 'Mar', rate: 82 },
    { month: 'Apr', rate: 85 },
    { month: 'May', rate: 80 },
    { month: 'Jun', rate: occupancyRate },
  ];
  
  const revenueTrend = [
    { month: 'Jan', amount: monthlyRevenue * 0.9 },
    { month: 'Feb', amount: monthlyRevenue * 0.92 },
    { month: 'Mar', amount: monthlyRevenue * 0.95 },
    { month: 'Apr', amount: monthlyRevenue * 0.98 },
    { month: 'May', amount: monthlyRevenue * 0.99 },
    { month: 'Jun', amount: monthlyRevenue },
  ];
  
  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Occupancy Rate</h3>
                <p className="text-2xl font-semibold mt-2">{occupancyRate.toFixed(1)}%</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {occupiedUnits} of {totalUnits} units occupied
                </div>
                <Badge className="mt-3 bg-green-100 text-green-800 hover:bg-green-200">
                  Health: {occupancyRate > 80 ? 'Excellent' : occupancyRate > 60 ? 'Good' : 'Needs Attention'}
                </Badge>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Monthly Revenue</h3>
                <p className="text-2xl font-semibold mt-2">${monthlyRevenue.toLocaleString()}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  Avg. ${(monthlyRevenue / (tenants.length || 1)).toFixed(2)} per tenant
                </div>
                <Badge className="mt-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                  {tenants.length} active income sources
                </Badge>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Collection Rate</h3>
                <p className="text-2xl font-semibold mt-2">{collectionRate.toFixed(1)}%</p>
                <div className="text-xs text-muted-foreground mt-1">
                  ${collectedRevenue.toLocaleString()} of ${monthlyRevenue.toLocaleString()} collected
                </div>
                <Badge className="mt-3 bg-blue-100 text-blue-800 hover:bg-blue-200">
                  Health: {collectionRate > 95 ? 'Excellent' : collectionRate > 80 ? 'Good' : 'Needs Attention'}
                </Badge>
              </Card>
            </div>
            
            <Tabs defaultValue="occupancy" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="tenants">Tenant Analysis</TabsTrigger>
                <TabsTrigger value="payments">Payment Analysis</TabsTrigger>
              </TabsList>
              
              {/* Occupancy Tab */}
              <TabsContent value="occupancy" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Occupancy Trend</h3>
                  <div className="h-64">
                    <AreaChart
                      data={occupancyTrend}
                      index="month"
                      categories={["rate"]}
                      colors={["blue"]}
                      valueFormatter={(value) => `${value}%`}
                    />
                  </div>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Unit Status</h3>
                    <div className="h-64">
                      <PieChart
                        data={[
                          { name: "Occupied", value: occupiedUnits },
                          { name: "Vacant", value: vacantUnits },
                        ]}
                        index="name"
                        category="value"
                        colors={["emerald", "red"]}
                        valueFormatter={(value) => `${value} units`}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Key Metrics</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Tenant Duration</p>
                        <p className="text-xl font-medium">14 months</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Turnover Rate (Annual)</p>
                        <p className="text-xl font-medium">22%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Days to Fill Vacancy</p>
                        <p className="text-xl font-medium">18 days</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Revenue Trend</h3>
                  <div className="h-64">
                    <AreaChart
                      data={revenueTrend}
                      index="month"
                      categories={["amount"]}
                      colors={["green"]}
                      valueFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                  </div>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Revenue Breakdown</h3>
                    <div className="h-64">
                      <PieChart
                        data={[
                          { type: "Rent", value: monthlyRevenue * 0.85 },
                          { type: "Deposits", value: monthlyRevenue * 0.1 },
                          { type: "Fees", value: monthlyRevenue * 0.05 },
                        ]}
                        index="type"
                        category="value"
                        colors={["blue", "amber", "violet"]}
                        valueFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Financial Health</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Net Operating Income</p>
                        <p className="text-xl font-medium">${(monthlyRevenue * 0.7).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cash Flow</p>
                        <p className="text-xl font-medium">${(monthlyRevenue * 0.4).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cap Rate</p>
                        <p className="text-xl font-medium">5.8%</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Tenant Analysis Tab */}
              <TabsContent value="tenants" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Tenant Status</h3>
                    <div className="h-64">
                      <BarChart
                        data={[
                          { status: "Active", count: statusCount.active },
                          { status: "Late", count: statusCount.late },
                          { status: "Notice", count: statusCount.notice },
                          { status: "Inactive", count: statusCount.inactive },
                        ]}
                        index="status"
                        categories={["count"]}
                        colors={["blue"]}
                        valueFormatter={(value) => `${value} tenants`}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Tenant Insights</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tenant Satisfaction Score</p>
                        <p className="text-xl font-medium">4.2/5.0</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Renewal Rate</p>
                        <p className="text-xl font-medium">76%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Lease Term</p>
                        <p className="text-xl font-medium">14 months</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Payment Analysis Tab */}
              <TabsContent value="payments" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
                    <div className="h-64">
                      <PieChart
                        data={Object.entries(paymentMethods).map(([method, count]) => ({
                          method: method.charAt(0).toUpperCase() + method.slice(1),
                          count,
                        }))}
                        index="method"
                        category="count"
                        colors={["indigo", "cyan", "amber", "emerald"]}
                        valueFormatter={(value) => `${value} payments`}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Payment Insights</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">On-Time Payment Rate</p>
                        <p className="text-xl font-medium">88%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Days Late</p>
                        <p className="text-xl font-medium">4.2 days</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Processing Time</p>
                        <p className="text-xl font-medium">1.5 days</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">KPI Recommendations</h3>
              <div className="space-y-3">
                <p className="text-sm">Based on your property data, we recommend monitoring these key metrics:</p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><span className="font-medium">Occupancy Rate:</span> Target at least 85% for optimal revenue</li>
                  <li><span className="font-medium">Rent Collection:</span> Aim for 95%+ collection rate</li>
                  <li><span className="font-medium">Tenant Turnover:</span> Keep below 25% annually</li>
                  <li><span className="font-medium">Maintenance Cost:</span> Target 15-20% of gross income</li>
                  <li><span className="font-medium">Tenant Satisfaction:</span> Monitor through regular surveys</li>
                </ul>
              </div>
            </Card>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Analytics;
