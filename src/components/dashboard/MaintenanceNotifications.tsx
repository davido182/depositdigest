import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bell, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  Home, 
  DollarSign, 
  Calendar,
  User,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SmartNotification {
  id: string;
  type: 'tenant_no_unit' | 'payment_overdue' | 'maintenance_urgent' | 'lease_expiring' | 'unit_vacant';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  data?: any;
}

export function SmartNotifications() {
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && (userRole === 'landlord_premium' || userRole === 'landlord_free')) {
      loadSmartNotifications();
    }
  }, [user, userRole]);

  const loadSmartNotifications = async () => {
    try {
      console.log('🔔 Loading smart notifications for user:', user?.id);
      
      const allNotifications: SmartNotification[] = [];
      
      // 1. Check for tenants without units
      await checkTenantsWithoutUnits(allNotifications);
      
      // 2. Check for overdue payments
      await checkOverduePayments(allNotifications);
      
      // 3. Check for urgent maintenance requests
      await checkUrgentMaintenance(allNotifications);
      
      // 4. Check for expiring leases
      await checkExpiringLeases(allNotifications);
      
      // 5. Check for long-vacant units
      await checkVacantUnits(allNotifications);
      
      // Sort by priority and date
      allNotifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log('✅ All smart notifications:', allNotifications);
      
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => n.priority === 'high').length);
      
    } catch (error) {
      console.error('💥 Error loading smart notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const checkTenantsWithoutUnits = async (notifications: SmartNotification[]) => {
    try {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, first_name, last_name, unit_id, is_active')
        .eq('landlord_id', user?.id)
        .eq('is_active', true)
        .is('unit_id', null);

      if (!error && tenants && tenants.length > 0) {
        tenants.forEach(tenant => {
          const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Inquilino';
          notifications.push({
            id: `tenant-no-unit-${tenant.id}`,
            type: 'tenant_no_unit',
            title: 'Inquilino sin unidad asignada',
            description: `${name} no tiene una unidad asignada`,
            priority: 'high',
            created_at: new Date().toISOString(),
            data: { tenantId: tenant.id, tenantName: name }
          });
        });
      }
    } catch (error) {
      console.error('Error checking tenants without units:', error);
    }
  };

  const checkOverduePayments = async (notifications: SmartNotification[]) => {
    try {
      // Get current month payment tracking from localStorage
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const storageKey = `payment_records_${user?.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(storageKey);
      
      if (storedRecords) {
        const records = JSON.parse(storedRecords);
        const currentMonthRecords = records.filter((r: any) => 
          r.year === currentYear && r.month === currentMonth
        );
        
        // Get all active tenants
        const { data: tenants, error } = await supabase
          .from('tenants')
          .select('id, first_name, last_name, monthly_rent')
          .eq('landlord_id', user?.id)
          .eq('is_active', true);

        if (!error && tenants) {
          const paidTenantIds = new Set(currentMonthRecords.filter((r: any) => r.paid).map((r: any) => r.tenantId));
          
          tenants.forEach(tenant => {
            if (!paidTenantIds.has(tenant.id)) {
              const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Inquilino';
              const isOverdue = new Date().getDate() > 5; // Consider overdue after 5th of month
              
              notifications.push({
                id: `payment-overdue-${tenant.id}`,
                type: 'payment_overdue',
                title: isOverdue ? 'Pago vencido' : 'Pago pendiente',
                description: `${name} - €${tenant.monthly_rent || 0} del mes actual`,
                priority: isOverdue ? 'high' : 'medium',
                created_at: new Date().toISOString(),
                data: { tenantId: tenant.id, tenantName: name, amount: tenant.monthly_rent }
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking overdue payments:', error);
    }
  };

  const checkUrgentMaintenance = async (notifications: SmartNotification[]) => {
    try {
      const { data: maintenance, error } = await supabase
        .from('maintenance_requests')
        .select('id, title, priority, unit_number, created_at')
        .eq('landlord_id', user?.id)
        .in('status', ['pending'])
        .in('priority', ['emergency', 'high']);

      if (!error && maintenance && maintenance.length > 0) {
        maintenance.forEach(request => {
          notifications.push({
            id: `maintenance-urgent-${request.id}`,
            type: 'maintenance_urgent',
            title: 'Mantenimiento urgente',
            description: `${request.title} - Unidad ${request.unit_number}`,
            priority: request.priority === 'emergency' ? 'high' : 'medium',
            created_at: request.created_at,
            data: { requestId: request.id }
          });
        });
      }
    } catch (error) {
      console.error('Error checking urgent maintenance:', error);
    }
  };

  const checkExpiringLeases = async (notifications: SmartNotification[]) => {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, first_name, last_name, move_out_date')
        .eq('landlord_id', user?.id)
        .eq('is_active', true)
        .not('move_out_date', 'is', null)
        .lte('move_out_date', thirtyDaysFromNow.toISOString().split('T')[0]);

      if (!error && tenants && tenants.length > 0) {
        tenants.forEach(tenant => {
          const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Inquilino';
          const daysUntilExpiry = Math.ceil((new Date(tenant.move_out_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          notifications.push({
            id: `lease-expiring-${tenant.id}`,
            type: 'lease_expiring',
            title: 'Contrato próximo a vencer',
            description: `${name} - ${daysUntilExpiry} días restantes`,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
            created_at: new Date().toISOString(),
            data: { tenantId: tenant.id, tenantName: name, daysLeft: daysUntilExpiry }
          });
        });
      }
    } catch (error) {
      console.error('Error checking expiring leases:', error);
    }
  };

  const checkVacantUnits = async (notifications: SmartNotification[]) => {
    try {
      const { data: units, error } = await supabase
        .from('units')
        .select('id, unit_number, updated_at, properties(name)')
        .eq('user_id', user?.id)
        .eq('is_available', true);

      if (!error && units && units.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        units.forEach(unit => {
          const lastUpdated = new Date(unit.updated_at);
          if (lastUpdated < thirtyDaysAgo) {
            const daysVacant = Math.ceil((new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
            
            notifications.push({
              id: `unit-vacant-${unit.id}`,
              type: 'unit_vacant',
              title: 'Unidad vacía por mucho tiempo',
              description: `Unidad ${unit.unit_number} - ${daysVacant} días vacía`,
              priority: daysVacant > 60 ? 'high' : 'medium',
              created_at: new Date().toISOString(),
              data: { unitId: unit.id, unitNumber: unit.unit_number, daysVacant }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error checking vacant units:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tenant_no_unit':
        return <User className="h-4 w-4" />;
      case 'payment_overdue':
        return <DollarSign className="h-4 w-4" />;
      case 'maintenance_urgent':
        return <Wrench className="h-4 w-4" />;
      case 'lease_expiring':
        return <Calendar className="h-4 w-4" />;
      case 'unit_vacant':
        return <Home className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getNotificationAction = (notification: SmartNotification) => {
    switch (notification.type) {
      case 'tenant_no_unit':
        return () => window.location.href = '/tenants';
      case 'payment_overdue':
        return () => window.location.href = '/payments';
      case 'maintenance_urgent':
        return () => window.location.href = '/maintenance';
      case 'lease_expiring':
        return () => window.location.href = '/tenants';
      case 'unit_vacant':
        return () => window.location.href = '/properties';
      default:
        return () => {};
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

  if (userRole === 'tenant') {
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
              Notificaciones Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Todo está en orden</p>
                <p className="text-xs mt-1">No hay notificaciones urgentes</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className="p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={getNotificationAction(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {notification.priority === 'high' ? 'Urgente' : 
                             notification.priority === 'medium' ? 'Importante' : 'Info'}
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
                <p className="text-xs text-muted-foreground text-center">
                  Haz clic en una notificación para ir a la sección correspondiente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}