
import { StatsCard } from "@/components/ui/StatsCard";
import {
  BarChart3,
  Building,
  CalendarClock,
  DollarSign,
  Home,
  Users,
  Wallet,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePropertyStats } from "@/hooks/use-property-stats";

interface DashboardSummaryProps {
  totalProperties?: number;
  totalUnits?: number;
  occupiedUnits?: number;
  monthlyRevenue?: number;
}

export function DashboardSummary({ 
  totalProperties,
  totalUnits,
  occupiedUnits,
  monthlyRevenue 
}: DashboardSummaryProps = {}) {
  const isMobile = useIsMobile();
  const { stats } = usePropertyStats();

  // Use props if provided, otherwise fall back to stats hook
  const displayStats = {
    totalProperties: totalProperties ?? stats.totalProperties,
    totalUnits: totalUnits ?? stats.totalUnits,
    occupiedUnits: occupiedUnits ?? stats.occupiedUnits,
    vacantUnits: (totalUnits ?? stats.totalUnits) - (occupiedUnits ?? stats.occupiedUnits),
    isLoading: stats.isLoading
  };

  if (displayStats.isLoading) {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      <StatsCard
        title="Total Propiedades"
        value={displayStats.totalProperties}
        icon={Building}
        description="Propiedades registradas"
      />
      <StatsCard
        title="Total Unidades"
        value={displayStats.totalUnits}
        icon={Home}
        description="Unidades totales"
      />
      <StatsCard
        title="Unidades Ocupadas"
        value={displayStats.occupiedUnits}
        icon={Users}
        description="Con inquilinos activos"
      />
      <StatsCard
        title="Unidades Disponibles"
        value={displayStats.vacantUnits}
        icon={Home}
        description="Listas para alquilar"
      />
    </div>
  );
}
