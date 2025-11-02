import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, AlertCircle, DollarSign, Building2, TrendingUp } from "lucide-react";
import { DashboardStats } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { EmergencyChart } from "./EmergencyChart";

interface FinalDashboardProps {
  stats: DashboardStats;
}

export function FinalDashboard({ stats }: FinalDashboardProps) {
  const { user } = useAuth();

  // Función para obtener datos de ingresos de 12 meses
  const getRevenueData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const months = [];

    const expectedMonthlyRevenue = stats.totalUnits * (stats.monthlyRevenue / Math.max(stats.occupiedUnits, 1));

    for (let month = 0; month < 12; month++) {
      const monthName = new Date(currentYear, month, 1).toLocaleDateString('es-ES', { month: 'short' });

      const storageKey = `payment_records_${user?.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(storageKey);
      let actualRevenue = 0;

      if (storedRecords) {
        try {
          const records = JSON.parse(storedRecords);
          const monthRecords = records.filter((r: any) =>
            r.year === currentYear && r.month === month && r.paid
          );

          if (monthRecords.length > 0) {
            actualRevenue = monthRecords.reduce((total: number, record: any) => {
              return total + (record.amount || 0);
            }, 0);
          }
        } catch (error) {
          console.error('Error parsing payment records:', error);
        }
      }

      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        actual: Math.max(actualRevenue, 0),
        expected: Math.max(expectedMonthlyRevenue, 0),
        isCurrentMonth: month === currentDate.getMonth(),
        isFutureMonth: month > currentDate.getMonth()
      });
    }

    return months;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Layout: Gráfico (2 columnas) + Tarjetas laterales (1 columna) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Gráfico de Ingresos - 2 columnas */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Ingresos de este año
              </CardTitle>
              <CardDescription>Evolución mensual de ingresos reales vs esperados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <EmergencyChart data={getRevenueData()} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Columna derecha con tarjetas apiladas */}
        <div className="space-y-6">
          
          {/* Pagos Pendientes */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">🔔 Pagos Pendientes</CardTitle>
                <motion.div
                  animate={{
                    rotate: stats.overduePayments > 0 ? [0, 10, -10, 0] : 0,
                    scale: stats.overduePayments > 0 ? [1, 1.1, 1] : 1
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <AlertCircle className={`h-6 w-6 ${stats.overduePayments > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center mb-2">
                  {stats.overduePayments || 0}
                </div>
                <p className="text-xs text-muted-foreground text-center mb-3">
                  {stats.overduePayments > 0 ? 'Requieren atención' : 'Todo al día'}
                </p>
                
                {stats.overduePayments > 0 && (
                  <div className="bg-red-50 p-2 rounded-lg">
                    <p className="text-xs text-red-700 font-medium">⚠️ Acción requerida</p>
                    <p className="text-xs text-red-600 mt-1">
                      Contacta con los inquilinos morosos
                    </p>
                  </div>
                )}
                
                {stats.overduePayments === 0 && (
                  <div className="bg-green-50 p-2 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">✅ Excelente</p>
                    <p className="text-xs text-green-600 mt-1">
                      Todos los pagos están al día
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Ingresos Acumulados */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">💰 Ingresos Acumulados {new Date().getFullYear()}</CardTitle>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center mb-2 text-emerald-600">
                  {(() => {
                    // Calcular ingresos acumulados del año
                    const currentYear = new Date().getFullYear();
                    const storageKey = `payment_records_${user?.id}_${currentYear}`;
                    const storedRecords = localStorage.getItem(storageKey);
                    let totalYearRevenue = 0;

                    if (storedRecords) {
                      try {
                        const records = JSON.parse(storedRecords);
                        const paidRecords = records.filter((r: any) => r.paid && r.year === currentYear);
                        totalYearRevenue = paidRecords.reduce((total: number, record: any) => {
                          return total + (record.amount || 0);
                        }, 0);
                      } catch (error) {
                        console.error('Error parsing payment records:', error);
                      }
                    }

                    return `€${totalYearRevenue.toLocaleString()}`;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Enero - {new Date().toLocaleDateString('es-ES', { month: 'long' })}
                </p>

                <div className="bg-emerald-50 p-2 rounded-lg">
                  <p className="text-xs text-emerald-700 font-medium">Progreso del año:</p>
                  <div className="mt-1">
                    <div className="bg-emerald-200 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min((new Date().getMonth() + 1) / 12 * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      {Math.round((new Date().getMonth() + 1) / 12 * 100)}% del año completado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>

      {/* LAS 3 TARJETAS BONITAS DE ANALYTICS - AL FINAL */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tarjeta de Ingresos (Verde) */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-100 text-sm font-medium">💰 Ingresos Mensuales</p>
                  <p className="text-3xl font-bold">€{stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-emerald-100 text-xs">
                    €{stats.totalTenants > 0 ? (stats.monthlyRevenue / stats.totalTenants).toFixed(0) : '0'} promedio por inquilino
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  {stats.totalTenants} fuentes activas
                </Badge>
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          </Card>
          
          {/* Tarjeta de Ocupación (Azul) */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-100 text-sm font-medium">🏢 Tasa de Ocupación</p>
                  <p className="text-3xl font-bold">{stats.occupancyRate.toFixed(1)}%</p>
                  <p className="text-blue-100 text-xs">
                    {stats.occupiedUnits} de {stats.totalUnits} unidades ocupadas
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Building2 className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className={`${stats.occupancyRate > 80 ? 'bg-green-500/20 text-green-100' : 
                                  stats.occupancyRate > 60 ? 'bg-yellow-500/20 text-yellow-100' : 
                                  'bg-red-500/20 text-red-100'} border-0`}>
                  {stats.occupancyRate > 80 ? '🎯 Excelente' : 
                   stats.occupancyRate > 60 ? '📈 Bueno' : 
                   '⚠️ Mejorar'}
                </Badge>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          </Card>
          
          {/* Tarjeta de Cobranza (Morado) */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-purple-100 text-sm font-medium">📊 Tasa de Cobranza</p>
                  <p className="text-3xl font-bold">{stats.collectionRate.toFixed(1)}%</p>
                  <p className="text-purple-100 text-xs">
                    Pagos completados este mes
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <BarChart3 className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className={`${stats.collectionRate > 95 ? 'bg-green-500/20 text-green-100' : 
                                  stats.collectionRate > 80 ? 'bg-yellow-500/20 text-yellow-100' : 
                                  'bg-red-500/20 text-red-100'} border-0`}>
                  {stats.collectionRate > 95 ? '💎 Excelente' : 
                   stats.collectionRate > 80 ? '👍 Bueno' : 
                   '🔔 Atención'}
                </Badge>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          </Card>

        </div>
      </motion.div>
    </div>
  );
}