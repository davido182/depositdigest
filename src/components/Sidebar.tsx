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
  MessageCircle
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Inquilinos",
    href: "/tenants",
    icon: Users,
  },
  {
    title: "Pagos",
    href: "/payments",
    icon: CreditCard,
  },
  {
    title: "Contabilidad",
    href: "/accounting",
    icon: Calculator,
  },
  {
    title: "Mantenimiento",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    title: "Asistente",
    href: "/assistant",
    icon: MessageCircle,
  },
  {
    title: "Reportes",
    href: "/reports",
    icon: FileText,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            </div>
          )}
        </div>

        {/* User info */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-b">
            <p className="text-sm text-muted-foreground truncate">
              {user?.email || 'Usuario'}
            </p>
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
