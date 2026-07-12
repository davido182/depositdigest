import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/i18nContext";
import {
  Building2,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Wrench,
  MessageCircle,
  UserPlus,
  ExternalLink,
  LogOut,
  Home,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, user, signOut } = useAuth();
  const { t } = useI18n();

  const getUserDisplayName = () => {
    if (!user) return t.sidebar.greeting;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) return fullName;
    if (user.email) return user.email.split('@')[0];
    return t.sidebar.greeting;
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNavigationItems = () => {
    if (userRole === 'tenant') {
      return [
        { name: t.nav.myUnit, href: "/dashboard", icon: Home },
        { name: t.nav.myPayments, href: "/payments", icon: CreditCard },
        { name: t.nav.maintenance, href: "/maintenance", icon: Wrench },
        { name: t.nav.settings, href: "/settings", icon: Settings },
      ];
    }

    // All landlords get all features (accounting disabled)
    return [
      { name: t.nav.dashboard, href: "/dashboard", icon: Building2 },
      { name: t.nav.properties, href: "/properties", icon: Building2 },
      { name: t.nav.tenants, href: "/tenants", icon: Users },
      { name: t.nav.payments, href: "/payments", icon: CreditCard },
      { name: t.nav.maintenance, href: "/maintenance", icon: Wrench },
      { name: t.nav.inviteTenant, href: "/invite-tenant", icon: UserPlus },
      { name: t.nav.assistant, href: "/assistant", icon: MessageCircle },
      { name: t.nav.analytics, href: "/analytics", icon: BarChart3 },
      { name: t.nav.reports, href: "/reports", icon: FileText },
      { name: t.nav.settings, href: "/settings", icon: Settings },
    ];
  };

  const navigationItems = getNavigationItems();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t.sidebar.signOut);
      setTimeout(() => navigate('/'), 100);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const displayName = getUserDisplayName();
  const initials = getUserInitials();
  const roleLabel = userRole === 'tenant' ? t.sidebar.tenantLabel : t.sidebar.landlordLabel;

  return (
    <SidebarContainer>
      {/* ── Header: Logo + Brand ── */}
      <SidebarHeader className="pb-2">
        <div className="flex items-center gap-3 px-1 pt-1">
          <img
            src="/rentaflux-logo.svg"
            alt="RentaFlux"
            className="h-9 w-9 shrink-0"
          />
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            RentaFlux
          </span>
        </div>

        {/* ── User Welcome Card ── */}
        <div className="mt-4 mx-1 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20 shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground leading-tight">
                {t.sidebar.greeting}, {displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3 text-sidebar-foreground/40 shrink-0" />
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {user?.email || roleLabel}
                </p>
              </div>
              <span className="inline-block mt-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="pt-2">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <NavLink to={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="gap-2 pb-4">
        <button
          onClick={() => navigate('/landing')}
          className="mx-1 flex items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t.sidebar.website}
        </button>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="mx-1 w-auto justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t.sidebar.signOut}
        </Button>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default Sidebar;
