
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Wrench,
  LogOut,
  Menu,
  Calculator,
  MessageCircle,
  Crown,
  UserPlus
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, userRole, isLandlord, isTenant, isPremium } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        title: "Inicio",
        href: "/",
        icon: LayoutDashboard,
        roles: ['landlord_free', 'landlord_premium', 'tenant']
      }
    ];

    const landlordItems = [
      {
        title: "Inquilinos",
        href: "/tenants",
        icon: Users,
        roles: ['landlord_free', 'landlord_premium']
      },
      {
        title: "Pagos",
        href: "/payments",
        icon: CreditCard,
        roles: ['landlord_free', 'landlord_premium', 'tenant']
      },
      {
        title: "Mantenimiento",
        href: "/maintenance",
        icon: Wrench,
        roles: ['landlord_free', 'landlord_premium', 'tenant']
      },
      {
        title: "Reportes",
        href: "/reports",
        icon: FileText,
        roles: ['landlord_free', 'landlord_premium']
      },
      {
        title: "Análisis",
        href: "/analytics",
        icon: BarChart3,
        roles: ['landlord_free', 'landlord_premium']
      }
    ];

    const premiumItems = [
      {
        title: "Contabilidad",
        href: "/accounting",
        icon: Calculator,
        roles: ['landlord_premium']
      },
      {
        title: "Asistente",
        href: "/assistant",
        icon: MessageCircle,
        roles: ['landlord_premium']
      }
    ];

    const tenantItems = [
      {
        title: "Mi Unidad",
        href: "/my-unit",
        icon: Users,
        roles: ['tenant']
      }
    ];

    const commonItems = [
      {
        title: "Configuración",
        href: "/settings",
        icon: Settings,
        roles: ['landlord_free', 'landlord_premium', 'tenant']
      }
    ];

    let allItems = [...baseItems];
    
    if (isLandlord) {
      allItems = [...allItems, ...landlordItems];
      if (isPremium) {
        allItems = [...allItems, ...premiumItems];
      }
    }
    
    if (isTenant) {
      allItems = [...allItems, ...tenantItems];
      // Add payment and maintenance for tenants
      allItems = [...allItems, 
        {
          title: "Pagos",
          href: "/payments",
          icon: CreditCard,
          roles: ['tenant']
        },
        {
          title: "Mantenimiento",
          href: "/maintenance",
          icon: Wrench,
          roles: ['tenant']
        }
      ];
    }
    
    allItems = [...allItems, ...commonItems];
    
    return allItems.filter(item => 
      item.roles.includes(userRole as any)
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada exitosamente");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  const handleUpgrade = async () => {
    try {
      const { createCheckoutSession } = useAuth();
      const checkoutUrl = await createCheckoutSession();
      window.open(checkoutUrl, '_blank');
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Error al procesar la actualización");
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      isCollapsed ? "w-16" : "w-56",
      "min-h-screen",
      className
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center border-b px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          {!isCollapsed && (
            <div className="flex items-center ml-2">
              <div className="h-6 w-6 rounded bg-primary mr-2"></div>
              <h2 className="text-lg font-semibold">RentFlow</h2>
              {isPremium && <Crown className="h-4 w-4 ml-1 text-yellow-500" />}
            </div>
          )}
        </div>

        {/* User info */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-b">
            <p className="text-sm text-muted-foreground truncate">
              {user?.email || 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {userRole === 'landlord_free' && 'Propietario (Gratis)'}
              {userRole === 'landlord_premium' && 'Propietario Premium'}
              {userRole === 'tenant' && 'Inquilino'}
            </p>
          </div>
        )}

        {/* Upgrade banner for free users */}
        {!isCollapsed && userRole === 'landlord_free' && (
          <div className="mx-3 my-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">¡Actualiza a Premium!</span>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              Desbloquea contabilidad completa y asistente IA
            </p>
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleUpgrade}
            >
              <Crown className="h-3 w-3 mr-1" />
              Actualizar
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="space-y-1 px-2">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                variant={location.pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-9",
                  isCollapsed ? "px-2" : "px-3",
                  location.pathname === item.href && "bg-secondary"
                )}
                onClick={() => navigate(item.href)}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Button>
            ))}
          </nav>
        </div>

        {/* Tenant invitation for landlords */}
        {!isCollapsed && isLandlord && (
          <div className="border-t p-2">
            <Button
              variant="outline"
              className="w-full justify-start h-9"
              onClick={() => navigate('/invite-tenant')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span>Invitar Inquilino</span>
            </Button>
          </div>
        )}

        {/* Logout button */}
        <div className="border-t p-2">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start h-9",
              isCollapsed ? "px-2" : "px-3"
            )}
            onClick={handleLogout}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
