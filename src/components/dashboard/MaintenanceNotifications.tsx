import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Wrench, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MaintenanceRequest {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  tenant_name?: string;
  unit_number?: string;
}

export function MaintenanceNotifications() {
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState<MaintenanceRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && userRole === 'landlord_premium') {
      loadMaintenanceNotifications();
    }
  }, [user, userRole]);

  const loadMaintenanceNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          title,
          priority,
          status,
          created_at,
          unit_number,
          tenants (
            name
          )
        `)
        .eq('landlord_id', user?.id)
        .in('status', ['open', 'pending'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading maintenance notifications:', error);
        return;
      }

      const formattedData = data?.map(item => ({
        id: item.id,
        title: item.title,
        priority: item.priority,
        status: item.status,
        created_at: item.created_at,
        tenant_name: item.tenants?.[0]?.name || 'Inquilino',
        unit_number: item.unit_number
      })) || [];

      setNotifications(formattedData);
      setUnreadCount(formattedData.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (userRole !== 'landlord_premium') {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notificaciones de Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay solicitudes pendientes</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className="p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                        {getPriorityIcon(notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.tenant_name} • Unidad {notification.unit_number}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority === 'high' ? 'Alta' : 
                             notification.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {notifications.length > 0 && (
              <div className="p-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/maintenance';
                  }}
                >
                  Ver todas las solicitudes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}