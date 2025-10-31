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
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
      const year = date.getFullYear();
      const month = date.getMonth();

      // Get payment records for this month from localStorage (tabla de seguimiento)
      const storageKey = `payment_records_${user?.id}_${year}`;
      const storedRecords = localStorage.getItem(storageKey);
      let monthlyRevenue = 0;

      if (storedRecords) {
        try {
          const records = JSON.parse(storedRecords);
          const monthRecords = records.filter((r: any) =>
            r.year === year && r.month === month && r.paid
          );

          // Calculate actual revenue from paid records using real amounts
          if (monthRecords.length > 0) {
            monthlyRevenue = monthRecords.reduce((total: number, record: any) => {
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
        amount: Math.max(monthlyRevenue, 0)
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
      {/* Métricas Principales */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden h-40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                €<AnimatedCounter value={stats.monthlyRevenue} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueChangePercent > 0 ? '+' : ''}{revenueChangePercent}% respecto al mes anterior
              </p>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden h-40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              <motion.div
                animate={{ scaleX: [1, 0.8, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <div className="w-6 h-4 bg-blue-500 rounded-sm relative overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-blue-300"
                    animate={{ width: [`${stats.occupancyRate}%`, `${Math.max(stats.occupancyRate - 10, 20)}%`, `${stats.occupancyRate}%`] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />
                </div>
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500 text-center">
                <AnimatedCounter value={stats.occupancyRate} suffix="%" />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {stats.occupiedUnits} de {stats.totalUnits} unidades
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden h-40">
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
              <div className={`text-2xl font-bold text-center ${stats.pendingDeposits > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                <AnimatedCounter value={stats.pendingDeposits} />
                {stats.pendingDeposits > 0 && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="ml-2 text-xs"
                  >
                    🔴
                  </motion.span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {stats.pendingDeposits > 0 ? 'Requieren atención' : 'Todo al día'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico de Ingresos y Estado General */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolución de Ingresos
              </CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full">
                {(() => {
                  const data = getRevenueData();
                  const maxAmount = Math.max(...data.map(d => d.amount), 1);
                  const width = 300;
                  const height = 150;
                  const padding = 40;
                  
                  // Calculate points for the line
                  const points = data.map((item, index) => {
                    const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
                    const y = height - padding - ((item.amount / maxAmount) * (height - 2 * padding));
                    return { x, y, amount: item.amount, month: item.month };
                  });
                  
                  const pathData = points.map((point, index) => 
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                  ).join(' ');

                  return (
                    <div className="relative">
                      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                          <line
                            key={ratio}
                            x1={padding}
                            y1={height - padding - ratio * (height - 2 * padding)}
                            x2={width - padding}
                            y2={height - padding - ratio * (height - 2 * padding)}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                          />
                        ))}
                        
                        {/* Y-axis labels */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                          <text
                            key={ratio}
                            x={padding - 10}
                            y={height - padding - ratio * (height - 2 * padding) + 4}
                            textAnchor="end"
                            className="text-xs fill-gray-500"
                          >
                            €{Math.round(maxAmount * ratio).toLocaleString()}
                          </text>
                        ))}
                        
                        {/* Line */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Area under the line */}
                        <path
                          d={`${pathData} L ${points[points.length - 1]?.x || 0} ${height - padding} L ${points[0]?.x || 0} ${height - padding} Z`}
                          fill="url(#gradient)"
                          opacity="0.2"
                        />
                        
                        {/* Data points */}
                        {points.map((point, index) => (
                          <g key={index}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="4"
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth="2"
                            />
                            {/* Tooltip on hover */}
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="8"
                              fill="transparent"
                              className="hover:fill-blue-100 cursor-pointer"
                            >
                              <title>
                                {point.month}: €{Math.round(point.amount).toLocaleString()}
                              </title>
                            </circle>
                          </g>
                        ))}
                        
                        {/* X-axis labels */}
                        {points.map((point, index) => (
                          <text
                            key={index}
                            x={point.x}
                            y={height - padding + 20}
                            textAnchor="middle"
                            className="text-xs fill-gray-500"
                          >
                            {point.month}
                          </text>
                        ))}
                        
                        {/* Gradient definition */}
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
