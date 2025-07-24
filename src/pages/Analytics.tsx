
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
  
  // Calculate monthly collection rate based on payment tracker data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const activeTenantIds = activeTenants.map(t => t.id);
  const currentMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.date);
    return p.status === 'completed' && 
           activeTenantIds.includes(p.tenantId) &&
           paymentDate.getMonth() === currentMonth &&
           paymentDate.getFullYear() === currentYear;
  });
  
  const paidTenants = new Set(currentMonthPayments.map(p => p.tenantId));
  const collectionRate = activeTenants.length > 0 ? (paidTenants.size / activeTenants.length) * 100 : 0;
  
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
        <h1 className="text-3xl font-semibold tracking-tight">Analíticas</h1>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Tasa de Ocupación</h3>
                <p className="text-2xl font-semibold mt-2">{occupancyRate.toFixed(1)}%</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {occupiedUnits} de {totalUnits} unidades ocupadas
                </div>
                <Badge className="mt-3 bg-green-100 text-green-800 hover:bg-green-200">
                  Estado: {occupancyRate > 80 ? 'Excelente' : occupancyRate > 60 ? 'Bueno' : 'Necesita Atención'}
                </Badge>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Ingresos Mensuales</h3>
                <p className="text-2xl font-semibold mt-2">€{monthlyRevenue.toLocaleString()}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  Prom. €{(monthlyRevenue / (tenants.length || 1)).toFixed(2)} por inquilino
                </div>
                <Badge className="mt-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                  {tenants.length} fuentes de ingresos activas
                </Badge>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Tasa de Cobranza</h3>
                <p className="text-2xl font-semibold mt-2">{collectionRate.toFixed(1)}%</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {paidTenants.size} de {activeTenants.length} inquilinos han pagado este mes
                </div>
                <Badge className="mt-3 bg-blue-100 text-blue-800 hover:bg-blue-200">
                  Estado: {collectionRate > 95 ? 'Excelente' : collectionRate > 80 ? 'Bueno' : 'Necesita Atención'}
                </Badge>
              </Card>
            </div>
            
            <Tabs defaultValue="occupancy" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
                <TabsTrigger value="revenue">Ingresos</TabsTrigger>
                <TabsTrigger value="tenants">Análisis de Inquilinos</TabsTrigger>
                <TabsTrigger value="payments">Análisis de Pagos</TabsTrigger>
              </TabsList>
              
              {/* Occupancy Tab */}
            <TabsContent value="occupancy" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Tendencia de Ocupación</h3>
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
                    <h3 className="text-lg font-medium mb-4">Estado de Unidades</h3>
                    <div className="h-64">
                      <PieChart
                        data={[
                          { name: "Ocupadas", value: occupiedUnits },
                          { name: "Vacías", value: vacantUnits },
                        ]}
                        index="name"
                        category="value"
                        colors={["emerald", "red"]}
                        valueFormatter={(value) => `${value} units`}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Métricas Clave</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Duración Promedio del Inquilino</p>
                        <p className="text-xl font-medium">14 meses</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa de Rotación (Anual)</p>
                        <p className="text-xl font-medium">22%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Días Promedio para Llenar Vacante</p>
                        <p className="text-xl font-medium">18 días</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Tendencia de Ingresos</h3>
                  <div className="h-64">
                    <AreaChart
                      data={revenueTrend}
                      index="month"
                      categories={["amount"]}
                      colors={["green"]}
                      valueFormatter={(value) => `€${value.toLocaleString()}`}
                    />
                  </div>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Desglose de Ingresos</h3>
                    <div className="h-64">
                      <PieChart
                        data={[
                          { type: "Renta", value: monthlyRevenue * 0.85 },
                          { type: "Depósitos", value: monthlyRevenue * 0.1 },
                          { type: "Comisiones", value: monthlyRevenue * 0.05 },
                        ]}
                        index="type"
                        category="value"
                        colors={["blue", "amber", "violet"]}
                        valueFormatter={(value) => `€${value.toLocaleString()}`}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Salud Financiera</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Ingreso Operativo Neto</p>
                        <p className="text-xl font-medium">€{(monthlyRevenue * 0.7).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Flujo de Efectivo</p>
                        <p className="text-xl font-medium">€{(monthlyRevenue * 0.4).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa de Capitalización</p>
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
                          { status: "Activo", count: statusCount.active },
                          { status: "Atrasado", count: statusCount.late },
                          { status: "Aviso", count: statusCount.notice },
                          { status: "Inactivo", count: statusCount.inactive },
                        ]}
                        index="status"
                        categories={["count"]}
                        colors={["blue"]}
                        valueFormatter={(value) => `${value} inquilinos`}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Información de Inquilinos</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Puntuación de Satisfacción</p>
                        <p className="text-xl font-medium">4.2/5.0</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa de Renovación</p>
                        <p className="text-xl font-medium">76%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duración Promedio del Contrato</p>
                        <p className="text-xl font-medium">14 meses</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Payment Analysis Tab */}
              <TabsContent value="payments" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Métodos de Pago</h3>
                    <div className="h-64">
                      <PieChart
                        data={Object.entries(paymentMethods).map(([method, count]) => ({
                          method: method.charAt(0).toUpperCase() + method.slice(1),
                          count,
                        }))}
                        index="method"
                        category="count"
                        colors={["indigo", "cyan", "amber", "emerald"]}
                        valueFormatter={(value) => `${value} pagos`}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Información de Pagos</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa de Pago a Tiempo</p>
                        <p className="text-xl font-medium">88%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Días Promedio de Retraso</p>
                        <p className="text-xl font-medium">4.2 días</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tiempo de Procesamiento</p>
                        <p className="text-xl font-medium">1.5 días</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Recomendaciones KPI</h3>
              <div className="space-y-3">
                <p className="text-sm">Basado en los datos de tu propiedad, recomendamos monitorear estas métricas clave:</p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><span className="font-medium">Tasa de Ocupación:</span> Objetivo de al menos 85% para ingresos óptimos</li>
                  <li><span className="font-medium">Cobranza de Renta:</span> Apuntar a 95%+ de tasa de cobranza</li>
                  <li><span className="font-medium">Rotación de Inquilinos:</span> Mantener por debajo del 25% anual</li>
                  <li><span className="font-medium">Costo de Mantenimiento:</span> Objetivo 15-20% del ingreso bruto</li>
                  <li><span className="font-medium">Satisfacción del Inquilino:</span> Monitorear a través de encuestas regulares</li>
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
