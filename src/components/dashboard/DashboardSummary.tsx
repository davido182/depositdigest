
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  DollarSign,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppData } from "@/hooks/use-app-data";

interface DashboardSummaryProps {
  totalProperties?: number;
  totalUnits?: number;
  occupiedUnits?: number;
}

export function DashboardSummary({
  totalProperties,
  totalUnits,
  occupiedUnits,
}: DashboardSummaryProps = {}) {
  const isMobile = useIsMobile();
  const { stats, isLoading } = useAppData();

  // Use props if provided, otherwise fall back to centralized data
  const displayStats = {
    totalProperties: totalProperties ?? stats.totalProperties,
    totalUnits: totalUnits ?? stats.totalUnits,
    occupiedUnits: occupiedUnits ?? stats.occupiedUnits,
    vacantUnits: (totalUnits ?? stats.totalUnits) - (occupiedUnits ?? stats.occupiedUnits),
    monthlyRevenue: stats.monthlyRevenue,
    collectionRate: stats.collectionRate,
    isLoading: isLoading
  };

  // Removed console.log for security

  if (displayStats.isLoading) {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const occupancyRate = displayStats.totalUnits > 0 ? (displayStats.occupiedUnits / displayStats.totalUnits) * 100 : 0;

  return (
    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
      {/* Revenue Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-emerald-100 text-sm font-medium">Ingresos Mensuales</p>
              <p className="text-3xl font-bold">€{displayStats.monthlyRevenue.toLocaleString()}</p>
              <p className="text-emerald-200 text-xs">
                €{displayStats.occupiedUnits > 0 ? (displayStats.monthlyRevenue / displayStats.occupiedUnits).toFixed(0) : '0'} promedio por inquilino
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30">
              {displayStats.occupiedUnits} fuentes activas
            </Badge>
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardContent>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      </Card>

      {/* Occupancy Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-blue-100 text-sm font-medium">Tasa de Ocupación</p>
              <p className="text-3xl font-bold">{occupancyRate.toFixed(1)}%</p>
              <p className="text-blue-200 text-xs">
                {displayStats.occupiedUnits} de {displayStats.totalUnits} unidades ocupadas
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4">
            <Badge className={`${occupancyRate > 80 ? 'bg-green-500/20 text-green-100' : 
                              occupancyRate > 60 ? 'bg-yellow-500/20 text-yellow-100' : 
                              'bg-red-500/20 text-red-100'} border-white/30`}>
              {occupancyRate > 80 ? '🎯 Excelente' : 
               occupancyRate > 60 ? '📈 Bueno' : 
               '⚠️ Mejorar'}
            </Badge>
          </div>
        </CardContent>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      </Card>

      {/* Collection Rate Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-purple-100 text-sm font-medium">Tasa de Cobranza</p>
              <p className="text-3xl font-bold">{parseFloat(displayStats.collectionRate).toFixed(1)}%</p>
              <p className="text-purple-200 text-xs">
                Pagos completados este mes
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4">
            <Badge className={`${parseFloat(displayStats.collectionRate) > 95 ? 'bg-green-500/20 text-green-100' : 
                              parseFloat(displayStats.collectionRate) > 80 ? 'bg-yellow-500/20 text-yellow-100' : 
                              'bg-red-500/20 text-red-100'} border-white/30`}>
              {parseFloat(displayStats.collectionRate) > 95 ? '✅ Excelente' : 
               parseFloat(displayStats.collectionRate) > 80 ? '📊 Bueno' : 
               '🔔 Atención'}
            </Badge>
          </div>
        </CardContent>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      </Card>
    </div>
  );
}
