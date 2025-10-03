import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Clock, DollarSign, Users, Wrench } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: 'maintenance' | 'payment' | 'lease' | 'urgent' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  read: boolean;
}

export function SmartNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const markAsRead = (notificationId: string) => {
    const seenNotifications = JSON.parse(localStorage.getItem('seen_notifications') || '[]');
    if (!seenNotifications.includes(notificationId)) {
      seenNotifications.push(notificationId);
      localStorage.setItem('seen_notifications', JSON.stringify(seenNotifications));
    }
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const notifications: Notification[] = [];

      // 1. Mantenimiento pendiente
      const { data: maintenance } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      maintenance?.forEach(req => {
        const daysSince = Math.floor((Date.now() - new Date(req.created_at).getTime()) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: `maintenance-${req.id}`,
          type: 'maintenance',
          title: 'Mantenimiento Pendiente',
          message: `${req.title} - Unidad ${req.unit_number} (${daysSince} días)`,
          priority: req.priority === 'emergency' ? 'high' : daysSince > 7 ? 'high' : 'medium',
          created_at: req.created_at,
          read: false
        });
      });

      // 2. Pagos atrasados
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const { data: tenants } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active');

      const { data: payments } = await supabase
        .from('payments')
        .select('*');

      tenants?.forEach(tenant => {
        const currentMonthPayments = payments?.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return p.tenant_id === tenant.id && 
                 paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        }) || [];

        const totalPaid = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const expectedAmount = Number(tenant.rent_amount);

        if (totalPaid < expectedAmount) {
          notifications.push({
            id: `payment-${tenant.id}`,
            type: 'payment',
            title: 'Pago Atrasado',
            message: `${tenant.name} debe $${(expectedAmount - totalPaid).toLocaleString()}`,
            priority: 'high',
            created_at: new Date().toISOString(),
            read: false
          });
        }
      });

      // 3. Contratos próximos a vencer
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      tenants?.forEach(tenant => {
        if (tenant.lease_end_date) {
          const leaseEndDate = new Date(tenant.lease_end_date);
          if (leaseEndDate <= threeMonthsFromNow && leaseEndDate > currentDate) {
            const daysUntilExpiry = Math.ceil((leaseEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            notifications.push({
              id: `lease-${tenant.id}`,
              type: 'lease',
              title: 'Contrato por Vencer',
              message: `${tenant.name} - Vence en ${daysUntilExpiry} días`,
              priority: daysUntilExpiry <= 30 ? 'high' : 'medium',
              created_at: new Date().toISOString(),
              read: false
            });
          }
        }
      });

      // 4. Verificar notificaciones ya vistas
      const seenNotifications = JSON.parse(localStorage.getItem('seen_notifications') || '[]');
      
      // Marcar como leídas las que ya se vieron
      notifications.forEach(notification => {
        if (seenNotifications.includes(notification.id)) {
          notification.read = true;
        }
      });

      // 5. Solo agregar mensaje de "todo en orden" si no hay notificaciones reales
      const realNotifications = notifications.filter(n => n.type !== 'info');
      if (realNotifications.length === 0) {
        const welcomeId = 'welcome-' + new Date().toDateString();
        if (!seenNotifications.includes(welcomeId)) {
          notifications.push({
            id: welcomeId,
            type: 'info',
            title: '¡Todo en orden!',
            message: 'No hay alertas pendientes en este momento',
            priority: 'low',
            created_at: new Date().toISOString(),
            read: false
          });
        }
      }

      // Ordenar por prioridad y fecha
      const sortedNotifications = notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNotifications(sortedNotifications.slice(0, 10)); // Máximo 10 notificaciones
      setUnreadCount(sortedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'lease': return <Clock className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };



  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} nuevas
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Cargando notificaciones...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No hay notificaciones
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className={`p-1 rounded-full ${getNotificationColor(notification.priority)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {notification.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-center justify-center text-sm text-primary cursor-pointer"
          onClick={() => {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('Todas las notificaciones marcadas como leídas');
          }}
        >
          Marcar todas como leídas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}