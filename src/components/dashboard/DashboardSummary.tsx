
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
import { DashboardStats } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardSummaryProps {
  stats: DashboardStats;
}

export function DashboardSummary({ stats }: DashboardSummaryProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      <StatsCard
        title="Monthly Revenue"
        value={`$${stats.monthlyRevenue.toLocaleString()}`}
        icon={DollarSign}
        description="This month"
        trend={{ value: 12.8, isPositive: true }}
      />
      <StatsCard
        title="Total Tenants"
        value={stats.totalTenants}
        icon={Users}
        description={`${stats.occupancyRate}% occupancy rate`}
      />
      <StatsCard
        title="Units Status"
        value={`${stats.occupiedUnits}/${stats.totalUnits}`}
        icon={Building}
        description={`${stats.totalUnits - stats.occupiedUnits} vacant units`}
      />
      <StatsCard
        title="Overdue Payments"
        value={stats.overduePayments}
        icon={Wallet}
        trend={{ value: 5.2, isPositive: false }}
        description="Need attention"
      />
    </div>
  );
}
