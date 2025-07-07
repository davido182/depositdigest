
import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Wrench,
  Calculator,
  MessageCircle,
  Crown,
  UserPlus,
  ExternalLink,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, hasActivePremium, user, signOut } = useAuth();

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "Usuario";
    
    // Try to get full_name from user metadata first
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) return fullName;
    
    // Fallback to email without @ part
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return "Usuario";
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "/", icon: Building2 },
    ];

    // Tenant view - limited options
    if (userRole === 'tenant') {
      return [
        { name: "Mi Unidad", href: "/", icon: Building2 },
        { name: "Mis Pagos", href: "/payments", icon: CreditCard },
        { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
        { name: "Configuración", href: "/settings", icon: Settings },
      ];
    }

    // Landlord items - available for both free and premium
    if (userRole?.startsWith('landlord')) {
      const landlordItems = [
        ...baseItems,
        { name: "Inquilinos", href: "/tenants", icon: Users },
        { name: "Pagos", href: "/payments", icon: CreditCard },
        { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
        { name: "Invitar Inquilino", href: "/invite-tenant", icon: UserPlus },
        { name: "Reportes", href: "/reports", icon: FileText },
      ];

      // Premium-only features
      if (hasActivePremium) {
        landlordItems.splice(-1, 0, // Insert before Reports
          { name: "Contabilidad", href: "/accounting", icon: Calculator },
          { name: "Asistente IA", href: "/assistant", icon: MessageCircle },
          { name: "Análisis", href: "/analytics", icon: BarChart3 }
        );
      }

      // Add settings at the end
      landlordItems.push({ name: "Configuración", href: "/settings", icon: Settings });
      
      return landlordItems;
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleLandingPageClick = () => {
    window.open('/landing', '_blank');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada exitosamente");
      navigate('/landing');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  const getRoleDisplayText = () => {
    if (!userRole) return "Cargando rol...";
    
    switch (userRole) {
      case 'landlord_free':
        return 'Propietario - Plan Gratuito';
      case 'landlord_premium':
        return 'Propietario - Plan Premium';
      case 'tenant':
        return 'Inquilino';
      default:
        return "Rol desconocido";
    }
  };

  return (
    <div className="bg-white border-r border-gray-200 w-64 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">RentFlow</h1>
            {hasActivePremium && (
              <div className="flex items-center text-xs text-yellow-600">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </div>
            )}
          </div>
        </div>
        
        {/* User name display */}
        <div className="text-sm font-medium text-gray-700 mb-1">
          Hola, {getUserDisplayName()}
        </div>
        <div className="text-xs text-gray-500">
          {getRoleDisplayText()}
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info and actions */}
      <div className="mt-auto space-y-3">
        {/* User info card */}
        {user && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-blue-900">Cuenta activa</div>
            </div>
            <div className="text-xs text-blue-700 mb-1">{user.email}</div>
            <div className="text-xs text-blue-600">
              {userRole === 'landlord_free' && 'Plan Gratuito'}
              {userRole === 'landlord_premium' && 'Plan Premium'}
              {userRole === 'tenant' && 'Inquilino'}
              {!userRole && 'Cargando rol...'}
            </div>
          </div>
        )}

        {/* Upgrade section for free users */}
        {userRole === 'landlord_free' && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <button
              onClick={handleLandingPageClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-2"
            >
              <Crown className="h-3 w-3" />
              Actualizar a Premium
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="text-xs text-gray-500 text-center">
              Accede a todas las funciones avanzadas
            </div>
          </div>
        )}

        {/* Landing page access for premium users */}
        {userRole === 'landlord_premium' && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <button
              onClick={handleLandingPageClick}
              className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1 w-full justify-center"
            >
              Ver Landing Page
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Sign out button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
