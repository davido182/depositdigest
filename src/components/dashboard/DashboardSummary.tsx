
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
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      {/* Total Properties Card */}
      <Card>
        <CardContent className="flex items-center p-6">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              Total Propiedades
            </p>
            <p className="text-2xl font-bold">
              {displayStats.totalProperties}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Units Card */}
      <Card>
        <CardContent className="flex items-center p-6">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              Total Unidades
            </p>
            <p className="text-2xl font-bold">
              {displayStats.totalUnits}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Occupied Units Card */}
      <Card>
        <CardContent className="flex items-center p-6">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              Unidades Ocupadas
            </p>
            <p className="text-2xl font-bold">
              {displayStats.occupiedUnits}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Available Units Card */}
      <Card>
        <CardContent className="flex items-center p-6">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              Unidades Disponibles
            </p>
            <p className="text-2xl font-bold">
              {displayStats.vacantUnits}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
