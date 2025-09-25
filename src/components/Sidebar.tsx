
import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  ExternalLink,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, hasActivePremium, user, signOut, isLoading } = useAuth();
  const { trialDaysLeft, isTrialUser } = useTrialCountdown();

  console.log("Sidebar render - userRole:", userRole, "isLoading:", isLoading);

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "Usuario";
    
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) return fullName;
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return "Usuario";
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    console.log("Getting navigation items for role:", userRole);
    
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
    if (userRole === 'landlord_free' || userRole === 'landlord_premium') {
      const landlordItems = [
        ...baseItems,
        { name: "Propiedades", href: "/properties", icon: Building2 },
         { name: "Inquilinos", href: "/tenants", icon: Users },
         { name: "Pagos", href: "/payments", icon: CreditCard },
        { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
      ];

      // Premium-only features
      if (userRole === 'landlord_premium') {
        landlordItems.push(
          { name: "Invitar Inquilino", href: "/invite-tenant", icon: UserPlus },
          { name: "Contabilidad", href: "/accounting", icon: Calculator },
          { name: "Asistente IA", href: "/assistant", icon: MessageCircle },
          { name: "Análisis", href: "/analytics", icon: BarChart3 },
          { name: "Reportes", href: "/reports", icon: FileText }
        );
      }

      // Add settings at the end
      landlordItems.push({ name: "Configuración", href: "/settings", icon: Settings });
      
      console.log("Landlord items:", landlordItems);
      return landlordItems;
    }

    console.log("Returning base items:", baseItems);
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleLandingPageClick = () => {
    navigate('/landing');
  };

  const handleUpgrade = async () => {
    try {
      toast.loading('Preparando pago...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          email: user?.email,
          priceId: 'price_1QdFz0DKXqPjJWpJqwgNLYkr'
        }
      });
      
      toast.dismiss();
      
      if (error) {
        console.error('Error creating checkout:', error);
        toast.error(`Error al procesar el pago: ${error.message || 'Error desconocido'}`);
        return;
      }
      
      if (data?.url) {
        toast.success('Redirigiendo a Stripe...');
        window.location.href = data.url; // Usar location.href en lugar de window.open
      } else {
        console.error('No URL returned from create-checkout:', data);
        toast.error('No se pudo generar el enlace de pago. Intenta de nuevo.');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error in handleUpgrade:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada exitosamente");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  const getRoleDisplayText = () => {
    if (isLoading) return "Cargando...";
    if (!userRole) return "Asignando rol...";
    
    switch (userRole) {
      case 'landlord_free':
        return 'Plan Gratuito';
      case 'landlord_premium':
        return 'Plan Premium';
      case 'tenant':
        return 'Inquilino';
      default:
        return "Plan Gratuito";
    }
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <div className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">RentaFlux</h1>
            {hasActivePremium && (
              <div className="flex items-center text-xs text-yellow-600">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-1 mt-4">
          <div className="text-sm font-medium text-gray-700">
            Hola, {getUserDisplayName()}
          </div>
          <div className="text-xs text-gray-500">
            {getRoleDisplayText()}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <NavLink to={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {/* Upgrade section for free users */}
        {userRole === 'landlord_free' && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <button
              onClick={handleUpgrade}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md mb-2"
            >
              <Crown className="h-4 w-4" />
              Actualizar a Premium
              <ExternalLink className="h-3 w-3" />
            </button>
            {isTrialUser && trialDaysLeft !== null && (
              <div className="text-xs text-center mb-2">
                <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium">
                  🎁 Prueba Premium: {trialDaysLeft} días restantes
                </div>
              </div>
            )}
            <div className="text-xs text-gray-600 text-center">
              🚀 Desbloquea RentaFlux Premium
            </div>
          </div>
        )}

        {/* Website access for all users */}
        {(userRole === 'landlord_premium' || userRole === 'tenant') && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <button
              onClick={handleLandingPageClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Ir a Sitio Web
            </button>
          </div>
        )}

        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default Sidebar;
