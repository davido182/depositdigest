import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Building2, 
  AlertCircle, 
  Users, 
  DollarSign,
  BarChart3,
  Crown,
  Zap
} from "lucide-react";
import { DashboardStats } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface IntelligentDashboardProps {
  stats: DashboardStats;
}

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
  const { userRole } = useAuth();
  const isPremium = userRole === 'landlord_premium';

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ delay: 0, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                €<AnimatedCounter value={stats.monthlyRevenue} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +12.8% respecto al mes anterior
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
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <CircularProgress value={stats.occupancyRate} label="Ocupación" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
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
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <AlertCircle className={`h-4 w-4 ${stats.overduePayments > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.overduePayments > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                <AnimatedCounter value={stats.overduePayments} />
                {stats.overduePayments > 0 && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="ml-2 text-xs"
                  >
                    🔴
                  </motion.span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overduePayments > 0 ? 'Requieren atención' : 'Todo al día'}
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
          className="md:col-span-2 lg:col-span-1"
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
              <div className="space-y-3">
                {[
                  { month: 'Ene', amount: stats.monthlyRevenue * 0.8 },
                  { month: 'Feb', amount: stats.monthlyRevenue * 0.9 },
                  { month: 'Mar', amount: stats.monthlyRevenue * 0.85 },
                  { month: 'Abr', amount: stats.monthlyRevenue * 1.1 },
                  { month: 'May', amount: stats.monthlyRevenue * 0.95 },
                  { month: 'Jun', amount: stats.monthlyRevenue },
                ].map((item, index) => (
                  <div key={item.month} className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-8">{item.month}</span>
                    <div className="flex-1">
                      <Progress 
                        value={(item.amount / stats.monthlyRevenue) * 100} 
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      €{Math.round(item.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resumen de Inquilinos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Inquilinos</span>
                <Badge variant="secondary">
                  <AnimatedCounter value={stats.totalTenants} />
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Unidades Vacías</span>
                <Badge variant={stats.vacantUnits > 0 ? "destructive" : "secondary"}>
                  <AnimatedCounter value={stats.vacantUnits} />
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Próximos Ingresos</span>
                <Badge variant="secondary">
                  {stats.upcomingMoveIns}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Salidas Próximas</span>
                <Badge variant={stats.upcomingMoveOuts > 0 ? "destructive" : "secondary"}>
                  {stats.upcomingMoveOuts}
                </Badge>
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
                Desbloquea RentFlow Premium
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

      {/* Insights IA para usuarios Premium */}
      {isPremium && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Zap className="h-5 w-5" />
                Insights IA Premium
              </CardTitle>
              <CardDescription className="text-blue-700">
                Recomendaciones personalizadas basadas en tus datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-100 rounded-lg text-sm text-blue-800">
                📈 Tu tasa de ocupación del {stats.occupancyRate}% está por encima del promedio del mercado (85%)
              </div>
              <div className="p-3 bg-green-100 rounded-lg text-sm text-green-800">
                💰 Puedes aumentar los ingresos un 8% ajustando el precio de las unidades vacías
              </div>
              <div className="p-3 bg-amber-100 rounded-lg text-sm text-amber-800">
                ⏰ Se recomienda revisar contratos que vencen en los próximos 60 días
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}