import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, DollarSign } from "lucide-react";
import { DashboardStats } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { CleanChart } from "./CleanChart";

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

    // CÁLCULO CORRECTO: Potencial total = suma REAL de TODAS las rentas de TODAS las unidades
    let totalPotentialRevenue = 0;

    // Método 1: Obtener datos reales de unidades desde localStorage (más preciso)
    const storageKey = `app_data_${user?.id}`;
    const storedAppData = localStorage.getItem(storageKey);
    
    if (storedAppData) {
      try {
        const appData = JSON.parse(storedAppData);
        if (appData.units && Array.isArray(appData.units)) {
          // Sumar TODAS las rentas de TODAS las unidades (ocupadas y vacantes)
          totalPotentialRevenue = appData.units.reduce((sum: number, unit: any) => {
            // Probar ambos nombres de campo: monthly_rent y rent_amount
            const rent = unit.monthly_rent || unit.rent_amount || 0;
            console.log('🔍 DEBUG Unit:', { 
              unit_id: unit.id, 
              monthly_rent: unit.monthly_rent, 
              rent_amount: unit.rent_amount, 
              final_rent: rent 
            });
            return sum + rent;
          }, 0);
          console.log('💰 DEBUG Total Potential Revenue:', totalPotentialRevenue);
        }
      } catch (error) {
        console.error('Error parsing app data:', error);
      }
    }

    // Método 2: Fallback usando promedio de unidades ocupadas
    if (totalPotentialRevenue === 0 && stats.totalUnits > 0 && stats.monthlyRevenue > 0) {
      const avgRentPerUnit = stats.occupiedUnits > 0 ? stats.monthlyRevenue / stats.occupiedUnits : 0;
      totalPotentialRevenue = stats.totalUnits * avgRentPerUnit;
    }

    // Método 3: Fallback final - estimación conservadora
    if (totalPotentialRevenue === 0 && stats.totalUnits > 0) {
      totalPotentialRevenue = stats.totalUnits * 800; // €800 por unidad como estimación
    }

    for (let month = 0; month < 12; month++) {
      const monthName = new Date(currentYear, month, 1).toLocaleDateString('es-ES', { month: 'short' });

      const paymentStorageKey = `payment_records_${user?.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(paymentStorageKey);
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
        expected: Math.max(totalPotentialRevenue, 0), // Potencial total de TODAS las unidades
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
            {/* Header removido - más espacio para el gráfico */}
            <CardContent>
              <div className="h-96 w-full">
                <CleanChart data={getRevenueData()} />
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
                  {(() => {
                    // CÁLCULO CORRECTO: Verificar pagos realmente pendientes y vencidos
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();

                    // Obtener inquilinos activos
                    const activeTenants = stats.totalTenants || 0;

                    // Verificar pagos del mes actual
                    const storageKey = `payment_records_${user?.id}_${currentYear}`;
                    const storedRecords = localStorage.getItem(storageKey);
                    let paidThisMonth = 0;

                    if (storedRecords) {
                      try {
                        const records = JSON.parse(storedRecords);
                        paidThisMonth = records.filter((r: any) =>
                          r.year === currentYear &&
                          r.month === currentMonth &&
                          r.paid === true
                        ).length;
                      } catch (error) {
                        console.error('Error parsing payment records:', error);
                      }
                    }

                    // Pagos pendientes = inquilinos activos - pagos realizados este mes
                    const realPendingPayments = Math.max(activeTenants - paidThisMonth, 0);
                    return realPendingPayments;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground text-center mb-3">
                  {(() => {
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();
                    const activeTenants = stats.totalTenants || 0;
                    const storageKey = `payment_records_${user?.id}_${currentYear}`;
                    const storedRecords = localStorage.getItem(storageKey);
                    let paidThisMonth = 0;

                    if (storedRecords) {
                      try {
                        const records = JSON.parse(storedRecords);
                        paidThisMonth = records.filter((r: any) =>
                          r.year === currentYear &&
                          r.month === currentMonth &&
                          r.paid === true
                        ).length;
                      } catch (error) {
                        console.error('Error parsing payment records:', error);
                      }
                    }

                    const realPendingPayments = Math.max(activeTenants - paidThisMonth, 0);
                    return realPendingPayments > 0 ? 'Requieren atención este mes' : 'Todo al día este mes';
                  })()}
                </p>

                {(() => {
                  const today = new Date();
                  const currentMonth = today.getMonth();
                  const currentYear = today.getFullYear();
                  const activeTenants = stats.totalTenants || 0;
                  const storageKey = `payment_records_${user?.id}_${currentYear}`;
                  const storedRecords = localStorage.getItem(storageKey);
                  let paidThisMonth = 0;

                  if (storedRecords) {
                    try {
                      const records = JSON.parse(storedRecords);
                      paidThisMonth = records.filter((r: any) =>
                        r.year === currentYear &&
                        r.month === currentMonth &&
                        r.paid === true
                      ).length;
                    } catch (error) {
                      console.error('Error parsing payment records:', error);
                    }
                  }

                  const realPendingPayments = Math.max(activeTenants - paidThisMonth, 0);

                  if (realPendingPayments > 0) {
                    return (
                      <div className="bg-red-50 p-2 rounded-lg">
                        <p className="text-xs text-red-700 font-medium">⚠️ Acción requerida</p>
                        <p className="text-xs text-red-600 mt-1">
                          {realPendingPayments} inquilino{realPendingPayments > 1 ? 's' : ''} sin pagar este mes
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-green-50 p-2 rounded-lg">
                        <p className="text-xs text-green-700 font-medium">✅ Excelente</p>
                        <p className="text-xs text-green-600 mt-1">
                          Todos los pagos están al día
                        </p>
                      </div>
                    );
                  }
                })()}
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

      {/* Tarjetas problemáticas eliminadas según solicitud */}
    </div>
  );
}