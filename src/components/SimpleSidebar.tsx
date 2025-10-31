import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTrialCountdown } from "@/hooks/use-trial";
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
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SimpleSidebar = () => {
  const location = useLocation();
  const { userRole, hasActivePremium, user, signOut, isLoading } = useAuth();
  const { trialDaysLeft, isTrialUser } = useTrialCountdown();

  // Removed console.log for security

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "Usuario";
    
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) return fullName;
    
    const email = user.email || "";
    return email.split('@')[0] || "Usuario";
  };

  const getNavigationItems = () => {
    // Removed console.log for security
    
    const baseItems = [
      { name: "Dashboard", href: "/dashboard", icon: Building2 },
    ];

    // Tenant view - limited options
    if (userRole === 'tenant') {
      return [
        { name: "Mi Unidad", href: "/dashboard", icon: Building2 },
        { name: "Mis Pagos", href: "/payments", icon: CreditCard },
        { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
        { name: "Configuración", href: "/settings", icon: Settings },
      ];
    }

    // Landlord items - available for both free and premium
    if (userRole === 'landlord_free' || userRole === 'landlord_premium') {
      const landlordItems = [
        ...baseItems,
        { name: "Propiedades", href: "/properties", icon: Building2 },
         { name: "Inquilinos", href: "/tenants", icon: Users },
         { name: "Pagos", href: "/payments", icon: CreditCard },
      ];

      // Premium-only features
      if (userRole === 'landlord_premium') {
        landlordItems.push(
          { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
          { name: "Invitar Inquilino", href: "/invite-tenant", icon: UserPlus },
          { name: "Contabilidad", href: "/accounting", icon: Calculator },
          { name: "Asistente IA", href: "/assistant", icon: MessageCircle },
          { name: "Análisis", href: "/analytics", icon: BarChart3 },
          { name: "Reportes", href: "/reports", icon: FileText }
        );
      }

      // Add settings at the end
      landlordItems.push({ name: "Configuración", href: "/settings", icon: Settings });
      
      // Removed console.log for security
      return landlordItems;
    }

    // Default fallback
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <img 
          src="/logo-rentaflux.ico" 
          alt="RentaFlux Logo" 
          className="h-8 w-8"
        />
        <div className="ml-3">
          <h1 className="text-xl font-bold text-gray-900">RentaFlux</h1>
          {hasActivePremium && (
            <div className="flex items-center text-xs text-yellow-600">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </div>
          )}
        </div>
      </div>
      
      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Bienvenido, {getUserDisplayName()}
        </p>
        {userRole && (
          <Badge variant="outline" className="text-xs mt-1">
            {userRole === 'landlord_premium' ? 'Premium' : 
             userRole === 'landlord_free' ? 'Free' : 'Tenant'}
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Trial Info */}
      {isTrialUser && trialDaysLeft !== null && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-800 font-medium text-center">
              🎁 Prueba Premium: {trialDaysLeft} días restantes
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-700 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default SimpleSidebar;
