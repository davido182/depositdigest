
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
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
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { userRole, hasActivePremium, user } = useAuth();

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "/", icon: Building2 },
      { name: "Inquilinos", href: "/tenants", icon: Users },
      { name: "Pagos", href: "/payments", icon: CreditCard },
      { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
    ];

    // Add role-specific items
    if (userRole?.startsWith('landlord')) {
      // Landlord items - available for both free and premium
      const landlordItems = [
        { name: "Invitar Inquilino", href: "/invite-tenant", icon: UserPlus },
        { name: "Reportes", href: "/reports", icon: FileText },
        { name: "Configuración", href: "/settings", icon: Settings },
      ];

      // Premium-only features
      if (hasActivePremium) {
        landlordItems.splice(-1, 0, // Insert before Settings
          { name: "Contabilidad", href: "/accounting", icon: Calculator },
          { name: "Asistente IA", href: "/assistant", icon: MessageCircle },
          { name: "Análisis", href: "/analytics", icon: BarChart3 }
        );
      }

      return [...baseItems, ...landlordItems];
    }

    // Tenant items - limited functionality
    if (userRole === 'tenant') {
      return [
        { name: "Mi Unidad", href: "/", icon: Building2 },
        { name: "Mis Pagos", href: "/payments", icon: CreditCard },
        { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
        { name: "Configuración", href: "/settings", icon: Settings },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleLandingPageClick = () => {
    window.open('/landing', '_blank');
  };

  return (
    <div className="bg-white border-r border-gray-200 w-64 min-h-screen p-4">
      <div className="mb-8">
        <div className="flex items-center space-x-2">
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
      </div>

      <nav className="space-y-2">
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

      {/* User info */}
      {user && (
        <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-4 w-4 text-blue-600" />
            <div className="text-sm font-medium text-blue-900">Usuario actual</div>
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

      {/* Role indicator and upgrade section */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">Estado de cuenta:</div>
        <div className="text-sm font-medium">
          {userRole === 'landlord_free' && 'Propietario (Gratuito)'}
          {userRole === 'landlord_premium' && 'Propietario (Premium)'}
          {userRole === 'tenant' && 'Inquilino'}
          {!userRole && 'Cargando...'}
        </div>
        
        {/* Upgrade section for free users */}
        {userRole === 'landlord_free' && (
          <div className="mt-3 space-y-2">
            <button
              onClick={handleLandingPageClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

        {/* Landing page access for premium users too */}
        {userRole === 'landlord_premium' && (
          <div className="mt-2">
            <button
              onClick={handleLandingPageClick}
              className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
            >
              Ver Landing Page
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
