import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Building2,
  AlertCircle,
  BarChart3,
  Crown,
  Zap
} from "lucide-react";
import { DashboardStats } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface IntelligentDashboardProps {
  stats: DashboardStats;
}

// Function to calculate real revenue change percentage
const calculateRevenueChange = (currentRevenue: number, userId: string): number => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  try {
    // Get current month data
    const currentStorageKey = `payment_records_${userId}_${currentYear}`;
    const currentStoredRecords = localStorage.getItem(currentStorageKey);

    // Get previous month data
    const previousStorageKey = `payment_records_${userId}_${previousYear}`;
    const previousStoredRecords = localStorage.getItem(previousStorageKey);

    if (!currentStoredRecords || !previousStoredRecords) {
      return 0; // No data available
    }

    const currentRecords = JSON.parse(currentStoredRecords);
    const previousRecords = JSON.parse(previousStoredRecords);

    // Count paid records for current month
    const currentPaidCount = currentRecords.filter((r: any) =>
      r.year === currentYear && r.month === currentMonth && r.paid
    ).length;

    // Count paid records for previous month
    const previousPaidCount = previousRecords.filter((r: any) =>
      r.year === previousYear && r.month === previousMonth && r.paid
    ).length;

    if (previousPaidCount === 0) {
      return currentPaidCount > 0 ? 100 : 0;
    }

    const changePercentage = ((currentPaidCount - previousPaidCount) / previousPaidCount) * 100;
    return Math.round(changePercentage * 10) / 10; // Round to 1 decimal
  } catch (error) {
    console.error('Error calculating revenue change:', error);
    return 0;
  }
};

// Animated Counter Component
const AnimatedCounter = ({
  value,
  duration = 1500,
  prefix = "",
  suffix = ""
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// Circular Progress Component
const CircularProgress = ({ value, label }: { value: number; label: string }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="2"
          />
          <motion.path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray={`${progress}, 100`}
            initial={{ strokeDasharray: "0, 100" }}
            animate={{ strokeDasharray: `${progress}, 100` }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{progress}%</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

export function IntelligentDashboard({ stats }: IntelligentDashboardProps) {
  const { userRole, user } = useAuth();
  const isPremium = userRole === 'landlord_premium';

  // Calculate real revenue change percentage
  const revenueChangePercent = user?.id ? calculateRevenueChange(stats.monthlyRevenue, user.id) : 0;

  // Calculate real revenue trend from payment tracking (tabla de seguimiento de pagos)
  const getRevenueData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const months = [];

    // Calculate expected revenue based on all units (occupied + vacant)
    const expectedMonthlyRevenue = stats.totalUnits * (stats.monthlyRevenue / Math.max(stats.occupiedUnits, 1));

    // Generate data for all 12 months (Enero - Diciembre)
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(currentYear, month, 1).toLocaleDateString('es-ES', { month: 'short' });

      // Get payment records for this month from localStorage (tabla de seguimiento)
      const storageKey = `payment_records_${user?.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(storageKey);
      let actualRevenue = 0;

      if (storedRecords) {
        try {
          const records = JSON.parse(storedRecords);
          const monthRecords = records.filter((r: any) =>
            r.year === currentYear && r.month === month && r.paid
          );

          // Calculate actual revenue from paid records using real amounts
          if (monthRecords.length > 0) {
            actualRevenue = monthRecords.reduce((total: number, record: any) => {
              // Use the stored amount from the payment record
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
      {/* Gráfico de Ingresos y Pagos Pendientes */}
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
                Evolución de Ingresos
              </CardTitle>
              <CardDescription>Ingresos reales vs esperados - Año completo {new Date().getFullYear()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                {(() => {
                  const data = getRevenueData();
                  const maxAmount = Math.max(...data.map(d => Math.max(d.actual, d.expected)), 1);
                  const width = 500;
                  const height = 280;
                  const padding = 60;

                  // Calculate points for actual revenue line
                  const actualPoints = data.map((item, index) => {
                    const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
                    const y = height - padding - ((item.actual / maxAmount) * (height - 2 * padding));
                    return { 
                      x, 
                      y, 
                      amount: item.actual, 
                      month: item.month,
                      isCurrentMonth: item.isCurrentMonth,
                      isFutureMonth: item.isFutureMonth
                    };
                  });

                  // Calculate points for expected revenue line
                  const expectedPoints = data.map((item, index) => {
                    const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
                    const y = height - padding - ((item.expected / maxAmount) * (height - 2 * padding));
                    return { 
                      x, 
                      y, 
                      amount: item.expected, 
                      month: item.month,
                      isCurrentMonth: item.isCurrentMonth,
                      isFutureMonth: item.isFutureMonth
                    };
                  });

                  const actualPathData = actualPoints.map((point, index) =>
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                  ).join(' ');

                  const expectedPathData = expectedPoints.map((point, index) =>
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                  ).join(' ');

                  return (
                    <div className="relative">
                      {/* Modern Legend */}
                      <div className="flex gap-6 mb-6 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-lg"></div>
                          <span className="font-medium text-gray-700">Ingresos Reales</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full opacity-60 border-2 border-dashed border-gray-300"></div>
                          <span className="font-medium text-gray-700">Ingresos Esperados</span>
                        </div>
                      </div>

                      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible drop-shadow-sm">
                        {/* Modern Grid */}
                        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => (
                          <line
                            key={ratio}
                            x1={padding}
                            y1={height - padding - ratio * (height - 2 * padding)}
                            x2={width - padding}
                            y2={height - padding - ratio * (height - 2 * padding)}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                          />
                        ))}

                        {/* Vertical grid lines for months */}
                        {actualPoints.map((point, index) => (
                          <line
                            key={`vgrid-${index}`}
                            x1={point.x}
                            y1={padding}
                            x2={point.x}
                            y2={height - padding}
                            stroke="#f8fafc"
                            strokeWidth="1"
                          />
                        ))}

                        {/* Y-axis labels with modern styling */}
                        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => (
                          <text
                            key={ratio}
                            x={padding - 15}
                            y={height - padding - ratio * (height - 2 * padding) + 4}
                            textAnchor="end"
                            className="text-xs fill-gray-400 font-medium"
                          >
                            €{Math.round(maxAmount * ratio).toLocaleString()}
                          </text>
                        ))}

                        {/* Expected revenue area with modern gradient */}
                        <path
                          d={`${expectedPathData} L ${expectedPoints[expectedPoints.length - 1]?.x || 0} ${height - padding} L ${expectedPoints[0]?.x || 0} ${height - padding} Z`}
                          fill="url(#modernExpectedGradient)"
                          opacity="0.15"
                        />

                        {/* Actual revenue area with modern gradient */}
                        <path
                          d={`${actualPathData} L ${actualPoints[actualPoints.length - 1]?.x || 0} ${height - padding} L ${actualPoints[0]?.x || 0} ${height - padding} Z`}
                          fill="url(#modernActualGradient)"
                          opacity="0.25"
                        />

                        {/* Expected revenue line with modern styling */}
                        <path
                          d={expectedPathData}
                          fill="none"
                          stroke="url(#expectedLineGradient)"
                          strokeWidth="3"
                          strokeDasharray="8,4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.7"
                        />

                        {/* Actual revenue line with modern gradient */}
                        <path
                          d={actualPathData}
                          fill="none"
                          stroke="url(#actualLineGradient)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#glow)"
                        />

                        {/* Modern data points for actual revenue */}
                        {actualPoints.map((point, index) => (
                          <g key={`actual-${index}`}>
                            {/* Outer glow */}
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="8"
                              fill="url(#actualPointGradient)"
                              opacity="0.2"
                            />
                            {/* Main point */}
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="5"
                              fill="url(#actualPointGradient)"
                              stroke="white"
                              strokeWidth="3"
                              filter="url(#pointShadow)"
                            />
                            {/* Current month indicator */}
                            {point.isCurrentMonth && (
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="12"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                strokeDasharray="3,3"
                                opacity="0.6"
                              />
                            )}
                            {/* Interactive area */}
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="12"
                              fill="transparent"
                              className="hover:fill-emerald-100 cursor-pointer transition-all duration-200"
                            >
                              <title>
                                {point.month}: €{Math.round(point.amount).toLocaleString()} (Real)
                                {point.isCurrentMonth ? ' - Mes Actual' : ''}
                              </title>
                            </circle>
                          </g>
                        ))}

                        {/* Modern data points for expected revenue */}
                        {expectedPoints.map((point, index) => (
                          <g key={`expected-${index}`}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="4"
                              fill="url(#expectedPointGradient)"
                              stroke="white"
                              strokeWidth="2"
                              opacity="0.8"
                            />
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="10"
                              fill="transparent"
                              className="hover:fill-gray-100 cursor-pointer transition-all duration-200"
                            >
                              <title>
                                {point.month}: €{Math.round(point.amount).toLocaleString()} (Esperado)
                              </title>
                            </circle>
                          </g>
                        ))}

                        {/* X-axis labels with modern styling */}
                        {actualPoints.map((point, index) => (
                          <text
                            key={index}
                            x={point.x}
                            y={height - padding + 25}
                            textAnchor="middle"
                            className={`text-xs font-medium ${
                              point.isCurrentMonth 
                                ? 'fill-emerald-600' 
                                : point.isFutureMonth 
                                  ? 'fill-gray-300' 
                                  : 'fill-gray-500'
                            }`}
                          >
                            {point.month}
                          </text>
                        ))}

                        {/* Modern gradient and filter definitions */}
                        <defs>
                          {/* Gradients for areas */}
                          <linearGradient id="modernActualGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#059669" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
                          </linearGradient>
                          
                          <linearGradient id="modernExpectedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#6b7280" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.05" />
                          </linearGradient>

                          {/* Gradients for lines */}
                          <linearGradient id="actualLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#059669" />
                            <stop offset="100%" stopColor="#047857" />
                          </linearGradient>

                          <linearGradient id="expectedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#9ca3af" />
                            <stop offset="100%" stopColor="#6b7280" />
                          </linearGradient>

                          {/* Gradients for points */}
                          <radialGradient id="actualPointGradient">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                          </radialGradient>

                          <radialGradient id="expectedPointGradient">
                            <stop offset="0%" stopColor="#d1d5db" />
                            <stop offset="100%" stopColor="#9ca3af" />
                          </radialGradient>

                          {/* Modern filters */}
                          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge> 
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>

                          <filter id="pointShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                          </filter>
                        </defs>
                      </svg>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagos Pendientes - 1 columna */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden h-64">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
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
              <div className={`text-4xl font-bold text-center mb-4 ${stats.pendingDeposits > 0 ? 'text-red-500' : 'text-gray-600'}`}>
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
              <p className="text-sm text-muted-foreground text-center mb-4">
                {stats.pendingDeposits > 0 ? 'Requieren atención inmediata' : 'Todos los pagos al día'}
              </p>
              
              {stats.pendingDeposits > 0 && (
                <div className="space-y-2">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-red-700 font-medium">Acciones recomendadas:</p>
                    <ul className="text-xs text-red-600 mt-1 space-y-1">
                      <li>• Revisar tabla de seguimiento</li>
                      <li>• Contactar inquilinos</li>
                      <li>• Verificar fechas de vencimiento</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {stats.pendingDeposits === 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-700 text-center">
                    ✅ Excelente gestión de cobranza
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-5 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Zap className="h-5 w-5" />
                Insights
              </CardTitle>
              <CardDescription className="text-blu e-700">
                Recomendaciones personalizadas basadas en tus datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.occupancyRate >= 85 ? (
                <div className="p-3 bg-blue-100 rounded-lg text-sm text-blue-800">
                  📈 Excelente: Tu tasa de ocupación del {stats.occupancyRate.toFixed(1)}% está por encima del promedio del mercado (85%)
                </div>
              ) : stats.occupancyRate >= 70 ? (
                <div className="p-3 bg-yellow-100 rounded-lg text-sm text-yellow-800">
                  📊 Tu tasa de ocupación del {stats.occupancyRate.toFixed(1)}% está cerca del promedio del mercado (85%)
                </div>
              ) : (
                <div className="p-3 bg-orange-100 rounded-lg text-sm text-orange-800">
                  📉 Tu tasa de ocupación del {stats.occupancyRate.toFixed(1)}% está por debajo del promedio del mercado (85%)
                </div>
              )}

              {stats.totalUnits - stats.occupiedUnits > 0 ? (
                <div className="p-3 bg-green-100 rounded-lg text-sm text-green-800">
                  💰 Tienes {stats.totalUnits - stats.occupiedUnits} unidad{stats.totalUnits - stats.occupiedUnits > 1 ? 'es' : ''} disponible{stats.totalUnits - stats.occupiedUnits > 1 ? 's' : ''} - Oportunidad de aumentar ingresos
                </div>
              ) : (
                <div className="p-3 bg-emerald-100 rounded-lg text-sm text-emerald-800">
                  🎯 ¡Perfecto! Todas tus unidades están ocupadas - Considera aumentar precios gradualmente
                </div>
              )}

              <div className="p-3 bg-amber-100 rounded-lg text-sm text-amber-800">
                ⏰ Unidades disponibles: {(100 - stats.occupancyRate).toFixed(1)}% - {stats.totalUnits > 0 ? 'Revisa estrategias de marketing' : 'Agrega propiedades para comenzar'}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Banner de Upgrade para usuarios Free */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Crown className="h-5 w-5" />
                Desbloquea RentaFlux Premium
              </CardTitle>
              <CardDescription className="text-amber-700">
                Accede a análisis avanzados, reportes automáticos y gestión ilimitada de propiedades
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Zap className="h-4 w-4" />
                  Análisis IA de rentabilidad
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <BarChart3 className="h-4 w-4" />
                  Reportes automáticos PDF/Excel
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Building2 className="h-4 w-4" />
                  Propiedades ilimitadas
                </div>
              </div>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Actualizar a Premium
              </Button>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-bl-full" />
          </Card>
        </motion.div>
      )}

      {/* Insights moved above, replacing tenant summary card */}
    </div>
  );
}
