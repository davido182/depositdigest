
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  DollarSign,
  BarChart3,
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
  const appData = useAppData();
  const stats = appData?.stats || {
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    monthlyRevenue: 0,
    activeTenants: 0,
    occupancyRate: 0,
    collectionRate: 0,
    totalTenants: 0,
    overduePayments: 0,
    pendingDeposits: 0,
    upcomingMoveIns: 0,
    upcomingMoveOuts: 0
  };
  const isLoading = appData?.isLoading || false;

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

  // Occupancy rate calculation removed - not needed

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      {/* Total Properties Card - Mejorada */}
      <Card className="relative overflow-hidden">
        <CardContent className="flex items-center p-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4 space-y-1 flex-1">
            <p className="text-sm font-medium text-gray-600">
              Total Propiedades
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {displayStats.totalProperties}
            </p>
            <p className="text-xs text-gray-500">
              {displayStats.totalUnits} unidades en total
            </p>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -translate-y-8 translate-x-8" />
        </CardContent>
      </Card>

      {/* Total Units Card - Mejorada */}
      <Card className="relative overflow-hidden">
        <CardContent className="flex items-center p-6">
          <div className="bg-emerald-100 p-3 rounded-full">
            <Building2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="ml-4 space-y-1 flex-1">
            <p className="text-sm font-medium text-gray-600">
              Total Unidades
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {displayStats.totalUnits}
            </p>
            <p className="text-xs text-gray-500">
              Capacidad de alquiler
            </p>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -translate-y-8 translate-x-8" />
        </CardContent>
      </Card>

      {/* Occupied Units Card - Mejorada */}
      <Card className="relative overflow-hidden">
        <CardContent className="flex items-center p-6">
          <div className="bg-green-100 p-3 rounded-full">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4 space-y-1 flex-1">
            <p className="text-sm font-medium text-gray-600">
              Unidades Ocupadas
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {displayStats.occupiedUnits}
            </p>
            <p className="text-xs text-gray-500">
              {displayStats.totalUnits > 0 ? Math.round((displayStats.occupiedUnits / displayStats.totalUnits) * 100) : 0}% de ocupación
            </p>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-full -translate-y-8 translate-x-8" />
        </CardContent>
      </Card>

      {/* Available Units Card - Mejorada */}
      <Card className="relative overflow-hidden">
        <CardContent className="flex items-center p-6">
          <div className="bg-orange-100 p-3 rounded-full">
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <div className="ml-4 space-y-1 flex-1">
            <p className="text-sm font-medium text-gray-600">
              Unidades Disponibles
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {displayStats.vacantUnits}
            </p>
            <p className="text-xs text-gray-500">
              {displayStats.vacantUnits > 0 ? 'Oportunidad de ingresos' : 'Completamente ocupado'}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-full -translate-y-8 translate-x-8" />
        </CardContent>
      </Card>
    </div>
  );
}
