import { useState, useEffect } from "react";
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
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    const loadRevenueData = async () => {
      if (user?.id) {
        const data = await getRevenueData();
        setRevenueData(data);
      }
    };
    loadRevenueData();
  }, [user?.id, stats]);

  // Función para obtener datos de ingresos de 12 meses
  const getRevenueData = async () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const months = [];

    // CÁLCULO CORRECTO: Obtener la suma REAL de TODAS las rentas de TODAS las unidades desde la base de datos
    let totalPotentialRevenue = 0;

    // Obtener datos reales de unidades desde Supabase
    const fetchUnitsData = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: units, error } = await supabase
          .from('units')
          .select(`
            monthly_rent,
            properties!inner(landlord_id)
          `)
          .eq('properties.landlord_id', user?.id || '');

        if (error) {
          console.error('Error fetching units:', error);
          return 0;
        }

        if (units && units.length > 0) {
          const total = units.reduce((sum: number, unit: any) => {
            const rent = unit.monthly_rent || 0;
            return sum + rent;
          }, 0);
          return total;
        }
        return 0;
      } catch (error) {
        console.error('Error in fetchUnitsData:', error);
        return 0;
      }
    };

    // Usar datos reales de la base de datos
    totalPotentialRevenue = await fetchUnitsData();

    // Fallback solo si no hay datos en la base de datos
    if (totalPotentialRevenue === 0 && stats.totalUnits > 0 && stats.monthlyRevenue > 0) {
      const avgRentPerUnit = stats.occupiedUnits > 0 ? stats.monthlyRevenue / stats.occupiedUnits : 0;
      totalPotentialRevenue = stats.totalUnits * avgRentPerUnit;
      console.log('💰 DEBUG Using fallback calculation:', totalPotentialRevenue);
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

          // Calculate actual revenue from paid records using real amounts (same as Analytics)
          actualRevenue = monthRecords.reduce((total: number, record: any) => {
            // Use the stored amount if available
            if (record.amount && record.amount > 0) {
              return total + record.amount;
            } else {
              // Fallback: find tenant and use their rent amount
              return total + 0; // We don't have tenant data here, so use 0 as fallback
            }
          }, 0);
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
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

        {/* Gráfico de Ingresos - 2 columnas */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            {/* Header removido - más espacio para el gráfico */}
            <CardContent className="h-full p-6">
              <div className="h-96 w-full">
                <CleanChart data={revenueData} />
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
                {(() => {
                  const today = new Date();
                  const currentMonth = today.getMonth();
                  const currentYear = today.getFullYear();
                  
                  // Obtener inquilinos activos
                  let activeTenants = 0;
                  
                  try {
                    const tenantsData = localStorage.getItem('tenants');
                    if (tenantsData) {
                      const parsedTenants = JSON.parse(tenantsData);
                      const validTenants = parsedTenants.filter((tenant: any) => 
                        tenant && 
                        tenant.status === 'active' && 
                        tenant.name && 
                        tenant.name !== 'N/A' &&
                        tenant.name.trim() !== ''
                      );
                      activeTenants = validTenants.length;
                    }
                  } catch (error) {
                    console.error('Error getting tenants data:', error);
                  }
                  
                  // Si no hay inquilinos, mostrar 0
                  if (activeTenants === 0) {
                    return (
                      <>
                        <div className="text-3xl font-bold text-center mb-2">0</div>
                        <p className="text-xs text-muted-foreground text-center mb-3">
                          Pagos pendientes
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">
                            No hay inquilinos activos
                          </p>
                        </div>
                      </>
                    );
                  }
                  
                  // Obtener registros de pago
                  const storageKey = `payment_records_${user?.id}_${currentYear}`;
                  const storedRecords = localStorage.getItem(storageKey);
                  
                  let paidThisMonth = 0;
                  let paidPreviousMonths = 0;

                  if (storedRecords) {
                    try {
                      const records = JSON.parse(storedRecords);
                      
                      // Contar pagos del mes actual
                      paidThisMonth = records.filter((r: any) =>
                        r.year === currentYear &&
                        r.month === currentMonth &&
                        r.paid === true &&
                        r.tenantName && 
                        r.tenantName !== 'N/A' && 
                        r.tenantName.trim() !== ''
                      ).length;

                      // Contar pagos de meses anteriores
                      for (let month = 0; month < currentMonth; month++) {
                        const paidInMonth = records.filter((r: any) =>
                          r.year === currentYear &&
                          r.month === month &&
                          r.paid === true &&
                          r.tenantName && 
                          r.tenantName !== 'N/A' && 
                          r.tenantName.trim() !== ''
                        ).length;
                        paidPreviousMonths += paidInMonth;
                      }
                    } catch (error) {
                      console.error('Error parsing payment records:', error);
                    }
                  }

                  // Cálculos simples y directos
                  const currentMonthPending = Math.max(activeTenants - paidThisMonth, 0);
                  const expectedPreviousMonths = activeTenants * currentMonth;
                  const previousMonthsUnpaid = Math.max(expectedPreviousMonths - paidPreviousMonths, 0);
                  const totalUnpaid = currentMonthPending + previousMonthsUnpaid;

                  return (
                    <>
                      <div className="text-3xl font-bold text-center mb-2">
                        {totalUnpaid}
                      </div>
                      <p className="text-xs text-muted-foreground text-center mb-3">
                        Pagos pendientes
                      </p>

                      {totalUnpaid > 0 ? (
                        <div className="bg-red-50 p-3 rounded-lg space-y-2">
                          <p className="text-xs text-red-700 font-medium">⚠️ Acción requerida</p>
                          
                          {currentMonthPending > 0 && (
                            <p className="text-xs text-red-600">
                              📅 <strong>Este mes:</strong> {currentMonthPending} inquilino{currentMonthPending > 1 ? 's' : ''} sin pagar
                            </p>
                          )}
                          
                          {previousMonthsUnpaid > 0 && (
                            <p className="text-xs text-red-600">
                              📋 <strong>Meses anteriores:</strong> {previousMonthsUnpaid} pago{previousMonthsUnpaid > 1 ? 's' : ''} atrasado{previousMonthsUnpaid > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-700 font-medium">✅ Excelente</p>
                          <p className="text-xs text-green-600 mt-1">
                            Todos los pagos están al día
                          </p>
                        </div>
                      )}
                    </>
                  );
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