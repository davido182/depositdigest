import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, AlertCircle, DollarSign } from "lucide-react";
import { DashboardStats } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { EmergencyChart } from "./EmergencyChart";

interface CleanDashboardProps {
  stats: DashboardStats;
}

export function CleanDashboard({ stats }: CleanDashboardProps) {
  const { user } = useAuth();

  // Función para obtener datos de ingresos de 12 meses
  const getRevenueData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const months = [];

    console.log('📊 getRevenueData: Generando datos del gráfico');
    console.log('📊 KPIs disponibles:', stats);

    const expectedMonthlyRevenue = stats.totalUnits * (stats.monthlyRevenue / Math.max(stats.occupiedUnits, 1));
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
    </div>
  );
}