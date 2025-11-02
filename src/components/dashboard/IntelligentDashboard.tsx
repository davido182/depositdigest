import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Building2,
  AlertCircle,
  BarChart3,
  DollarSign
} from "lucide-react";
import { DashboardStats } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
// useAppData no es necesario aquí, usamos los datos que vienen del Dashboard
import { ModernChartFixed } from "./ModernChartFixed";

interface IntelligentDashboardProps {
  stats: DashboardStats;
}

// Componente AnimatedCounter
const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};

export function IntelligentDashboard({ stats }: IntelligentDashboardProps) {
  const { user } = useAuth();

  // Usar los datos que se pasan como parámetro (que vienen de useAppData en Dashboard.tsx)
  const kpis = {
    totalProperties: stats.totalUnits > 0 ? 1 : 0, // Estimación
    totalUnits: stats.totalUnits,
    occupiedUnits: stats.occupiedUnits,
    vacantUnits: stats.vacantUnits,
    monthlyRevenue: stats.monthlyRevenue,
    activeTenants: stats.totalTenants,
    occupancyRate: stats.occupancyRate,
    collectionRate: stats.collectionRate || 85, // Valor por defecto si no existe
    totalTenants: stats.totalTenants,
    overduePayments: stats.overduePayments,
    pendingDeposits: stats.pendingDeposits,
    upcomingMoveIns: stats.upcomingMoveIns,
    upcomingMoveOuts: stats.upcomingMoveOuts
  };

  // Función para obtener datos de ingresos de 12 meses
  const getRevenueData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const months = [];

    console.log('📊 getRevenueData: Generando datos del gráfico');
    console.log('📊 KPIs disponibles:', kpis);

    const expectedMonthlyRevenue = kpis.totalUnits * (kpis.monthlyRevenue / Math.max(kpis.occupiedUnits, 1));
    console.log('📊 Ingreso mensual esperado:', expectedMonthlyRevenue);

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

    console.log('📊 Datos del gráfico generados:', months);
    return months;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Gráfico de Ingresos y Tarjetas Laterales */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Gráfico de Evolución - 2 columnas */}
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
              <CardDescription>Ingresos potenciales vs ingresos reales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ModernChartFixed data={getRevenueData()} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Columna derecha con 2 tarjetas apiladas */}
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
                    rotate: stats.pendingDeposits > 0 ? [0, 10, -10, 0] : 0,
                    scale: stats.pendingDeposits > 0 ? [1, 1.1, 1] : 1
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <AlertCircle className={`h-6 w-6 ${stats.pendingDeposits > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                </motion.div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold text-center mb-2 ${stats.pendingDeposits > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                  <AnimatedCounter value={stats.pendingDeposits} />
                  {stats.pendingDeposits > 0 && (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="ml-2 text-lg"
                    >
                      🔴
                    </motion.span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center mb-3">
                  {stats.pendingDeposits > 0 ? 'Requieren atención' : 'Todos al día'}
                </p>

                {stats.pendingDeposits > 0 ? (
                  <div className="bg-red-50 p-2 rounded-lg">
                    <p className="text-xs text-red-700 font-medium">Acciones:</p>
                    <ul className="text-xs text-red-600 mt-1 space-y-1">
                      <li>• Revisar seguimiento</li>
                      <li>• Contactar inquilinos</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-green-50 p-2 rounded-lg">
                    <p className="text-xs text-green-700 text-center">
                      ✅ Excelente gestión
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
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
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
                  <p className="text-xs text-emerald-700 font-medium">Progreso:</p>
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
                      {Math.round((new Date().getMonth() + 1) / 12 * 100)}% del año
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Tarjetas KPI Modernizadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-100 text-sm font-medium">💰 Ingresos Mensuales</p>
                  <p className="text-3xl font-bold">€{kpis.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-emerald-100 text-xs">
                    €{kpis.activeTenants > 0 ? (kpis.monthlyRevenue / kpis.activeTenants).toFixed(0) : '0'} promedio por inquilino
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  {kpis.activeTenants} fuentes activas
                </Badge>
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          </Card>
        </motion.div>

        {/* Occupancy Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-100 text-sm font-medium">🏢 Tasa de Ocupación</p>
                  <p className="text-3xl font-bold">{kpis.occupancyRate.toFixed(1)}%</p>
                  <p className="text-blue-100 text-xs">
                    {kpis.occupiedUnits} de {kpis.totalUnits} unidades ocupadas
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Building2 className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className={`${kpis.occupancyRate > 80 ? 'bg-green-500/20 text-green-100' :
                  kpis.occupancyRate > 60 ? 'bg-yellow-500/20 text-yellow-100' :
                    'bg-red-500/20 text-red-100'} border-0`}>
                  {kpis.occupancyRate > 80 ? '🎯 Excelente' :
                    kpis.occupancyRate > 60 ? '📈 Bueno' :
                      '⚠️ Mejorar'}
                </Badge>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          </Card>
        </motion.div>

        {/* Collection Rate Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-purple-100 text-sm font-medium">📊 Tasa de Cobranza</p>
                  <p className="text-3xl font-bold">{kpis.collectionRate.toFixed(1)}%</p>
                  <p className="text-purple-100 text-xs">
                    Pagos completados este mes
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <BarChart3 className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className={`${kpis.collectionRate > 95 ? 'bg-green-500/20 text-green-100' :
                  kpis.collectionRate > 80 ? 'bg-yellow-500/20 text-yellow-100' :
                    'bg-red-500/20 text-red-100'} border-0`}>
                  {kpis.collectionRate > 95 ? '💎 Excelente' :
                    kpis.collectionRate > 80 ? '👍 Bueno' :
                      '🔔 Atención'}
                </Badge>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 