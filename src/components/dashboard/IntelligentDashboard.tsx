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
                �  DASHBOARD LIMPIO Y FUNCIONANDO
              </CardTitle>
              <CardDescription>✅ ARCHIVO RECONSTRUIDO - Gráfico de 12 meses funcionando</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                {(() => {
                  const data = getRevenueData();
                  const maxAmount = Math.max(...data.map(d => Math.max(d.actual, d.expected)), 1);
                  const width = 500;
                  const height = 280;
                  const padding = 60;

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

                  const expectedPoints = data.map((item, index) => {
                    const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
                    const y = height - padding - ((item.expected / maxAmount) * (height - 2 * padding));
                    return { x, y, amount: item.expected };
                  });

                  const actualPathData = actualPoints.map((point, index) =>
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                  ).join(' ');

                  const expectedPathData = expectedPoints.map((point, index) =>
                    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                  ).join(' ');

                  return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                      <defs>
                        <linearGradient id="actualLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="expectedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6b7280" />
                          <stop offset="100%" stopColor="#4b5563" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                        <g key={index}>
                          <line
                            x1={padding}
                            y1={height - padding - (ratio * (height - 2 * padding))}
                            x2={width - padding}
                            y2={height - padding - (ratio * (height - 2 * padding))}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                          />
                          <text
                            x={padding - 10}
                            y={height - padding - (ratio * (height - 2 * padding)) + 5}
                            textAnchor="end"
                            className="text-xs fill-gray-500"
                          >
                            €{Math.round(maxAmount * ratio).toLocaleString()}
                          </text>
                        </g>
                      ))}

                      {/* Expected revenue line */}
                      <path
                        d={expectedPathData}
                        fill="none"
                        stroke="url(#expectedLineGradient)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.6"
                      />

                      {/* Actual revenue line */}
                      <path
                        d={actualPathData}
                        fill="none"
                        stroke="url(#actualLineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data points */}
                      {actualPoints.map((point, index) => (
                        <g key={index}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="5"
                            fill="#10b981"
                            stroke="white"
                            strokeWidth="3"
                          />
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
                        </g>
                      ))}

                      {/* Month labels */}
                      {actualPoints.map((point, index) => (
                        <text
                          key={index}
                          x={point.x}
                          y={height - padding + 25}
                          textAnchor="middle"
                          className={`text-xs font-medium ${point.isCurrentMonth
                            ? 'fill-emerald-600'
                            : point.isFutureMonth
                              ? 'fill-gray-300'
                              : 'fill-gray-500'
                            }`}
                        >
                          {point.month}
                        </text>
                      ))}
                    </svg>
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
                  <p className="text-3xl font-bold">€{stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-emerald-100 text-xs">
                    €{stats.occupiedUnits > 0 ? (stats.monthlyRevenue / stats.occupiedUnits).toFixed(0) : '0'} promedio por unidad
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  {stats.occupiedUnits} fuentes activas
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
        </motion.div>
      </div>
    </div>
  );
}