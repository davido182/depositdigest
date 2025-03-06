
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden p-6 rounded-xl group transition-all duration-300",
        className
      )}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {(description || trend) && (
            <div className="flex items-center space-x-2">
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive
                      ? "text-emerald-500"
                      : "text-destructive"
                  )}
                >
                  {trend.isPositive ? "+" : "-"}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && (
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10">
        <Icon className="h-24 w-24 translate-x-4 translate-y-4" />
      </div>
    </div>
  );
}
