
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

export function DashboardSummary() {
  const isMobile = useIsMobile();
  const { stats } = usePropertyStats();

  if (stats.isLoading) {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      <StatsCard
        title="Total Propiedades"
        value={stats.totalProperties}
        icon={Building}
        description={`${stats.occupancyRate}% ocupación`}
      />
      <StatsCard
        title="Estado Unidades"
        value={`${stats.occupiedUnits}/${stats.totalUnits}`}
        icon={Home}
        description={`${stats.vacantUnits} unidades vacantes`}
      />
      <StatsCard
        title="Pagos Pendientes"
        value={stats.overduePayments}
        icon={Wallet}
        trend={{ value: 5.2, isPositive: false }}
        description="Requieren atención"
      />
    </div>
  );
}
