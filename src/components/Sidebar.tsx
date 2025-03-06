
import {
  BarChart3,
  Users,
  Wallet,
  FileText,
  Settings,
  Home,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/",
    },
    {
      title: "Tenants",
      icon: Users,
      path: "/tenants",
    },
    {
      title: "Payments",
      icon: Wallet,
      path: "/payments",
    },
    {
      title: "Reports",
      icon: FileText,
      path: "/reports",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <SidebarComponent>
      <SidebarHeader className="p-4 flex items-center gap-2 border-b border-sidebar-border">
        <div className="flex items-center justify-between w-full">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary"></div>
              <h1 className="text-lg font-semibold tracking-tight">RentFlow</h1>
            </div>
          )}
          <SidebarTrigger
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-sidebar-accent transition-colors duration-200"
          >
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <button 
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </SidebarComponent>
  );
}
