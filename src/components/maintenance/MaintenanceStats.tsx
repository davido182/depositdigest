import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MaintenanceStats {
  total: number;
  pending: number;
  assigned: number;
  in_progress: number;
  completed: number;
  emergency: number;
  high_priority: number;
  avg_completion_days: number;
  active_providers: number;
}

export function MaintenanceStats() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["maintenance-stats", user?.id],
    queryFn: async (): Promise<MaintenanceStats> => {
      // Get all maintenance requests for the landlord
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select('status, priority, created_at, completed_at')
        .eq('landlord_id', user?.id);

      if (error) throw error;

      // Get active providers count
      const { data: providers, error: providersError } = await supabase
        .from('maintenance_providers')
        .select('id')
        .eq('landlord_id', user?.id)
        .eq('is_active', true);

      if (providersError) throw providersError;

      // Calculate stats
      const total = requests?.length || 0;
      const pending = requests?.filter(r => r.status === 'pending').length || 0;
      const assigned = requests?.filter(r => r.status === 'assigned').length || 0;
      const in_progress = requests?.filter(r => r.status === 'in_progress').length || 0;
      const completed = requests?.filter(r => r.status === 'completed').length || 0;
      const emergency = requests?.filter(r => r.priority === 'emergency').length || 0;
      const high_priority = requests?.filter(r => r.priority === 'high').length || 0;

      // Calculate average completion time
      const completedRequests = requests?.filter(r => r.status === 'completed' && r.completed_at) || [];
      let avg_completion_days = 0;
      
      if (completedRequests.length > 0) {
        const totalDays = completedRequests.reduce((sum, request) => {
          const created = new Date(request.created_at);
          const completed = new Date(request.completed_at!);
          const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avg_completion_days = Math.round(totalDays / completedRequests.length);
      }

      return {
        total,
        pending,
        assigned,
        in_progress,
        completed,
        emergency,
        high_priority,
        avg_completion_days,
        active_providers: providers?.length || 0
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total de Solicitudes",
      value: stats.total,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Pendientes",
      value: stats.pending,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      badge: stats.pending > 0 ? "Requiere atención" : undefined
    },
    {
      title: "En Progreso",
      value: stats.assigned + stats.in_progress,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Completadas",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Emergencias",
      value: stats.emergency,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      badge: stats.emergency > 0 ? "Urgente" : undefined
    },
    {
      title: "Alta Prioridad",
      value: stats.high_priority,
      icon: TrendingUp,
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      title: "Tiempo Promedio",
      value: `${stats.avg_completion_days} días`,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      isText: true
    },
    {
      title: "Proveedores Activos",
      value: stats.active_providers,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Estadísticas de Mantenimiento</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.isText ? stat.value : stat.value}
                  </div>
                  {stat.badge && (
                    <Badge variant="destructive" className="text-xs">
                      {stat.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}