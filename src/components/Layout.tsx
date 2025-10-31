
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { OfflineBanner } from "./ui/offline-banner";
import { useDeviceFeatures } from "@/hooks/use-device-features";
import { useOrientation } from "@/hooks/use-orientation";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MobileOrientationWrapper } from "./MobileOrientationWrapper";
import { SmartNotifications } from "./dashboard/SmartNotifications";
import { cn } from "@/lib/utils";
import { liveUpdatesService } from "@/services/LiveUpdatesService";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { isNative, platform } = useDeviceFeatures();
  const { orientation, isLandscape } = useOrientation();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    setMounted(true);
    // Removed console.log for security
    
    if (isNative) {
      // Removed console.log for security
      // Inicializar Live Updates solo en plataformas nativas
      liveUpdatesService.initialize().catch(error => {
        console.error("Error initializing Live Updates:", error);
      });
    } else {
      // Removed console.log for security
    }
  }, [isNative, platform]);

  useEffect(() => {
    // Removed console.log for security
  }, [isAuthenticated, isLoading, user]);

  if (!mounted) {
    // Removed console.log for security
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading while auth is being determined
  if (isLoading) {
    // Removed console.log for security
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only show sidebar if user is authenticated
  if (!isAuthenticated) {
    // Removed console.log for security
    return (
      <MobileOrientationWrapper className={cn(
        "min-h-screen bg-background",
        isNative && isLandscape && "min-h-[100dvh]"
      )}>
        <OfflineBanner />
        <div className="container max-w-7xl mx-auto py-4 md:py-6 space-y-6 md:space-y-8">
          {children}
        </div>
      </MobileOrientationWrapper>
    );
  }

  // Removed console.log for security
  return (
    <MobileOrientationWrapper>
      <SidebarProvider>
        <div className={cn(
          "min-h-screen flex w-full bg-background",
          isNative && isLandscape && "min-h-[100dvh]",
          isNative && "overflow-hidden"
        )}>
          <Sidebar />
          <SidebarInset className={cn(
            "flex flex-col",
            isNative && isLandscape && "h-[100dvh]"
          )}>
            <header className={cn(
              "flex shrink-0 items-center gap-2 border-b px-4 mobile-landscape-header",
              isNative && isLandscape ? "h-12" : "h-16"
            )}>
              <SidebarTrigger className="-ml-1" />
              <div className="ml-auto flex items-center gap-2">
                <SmartNotifications />
                <OfflineBanner />
              </div>
            </header>
            <main className={cn(
              "flex-1 overflow-auto mobile-landscape-scroll",
              isNative && isLandscape && "h-0" // Force height calculation for landscape
            )}>
              <div className={cn(
                "container max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in mobile-landscape-compact",
                isNative && isLandscape ? "py-2 px-4" : "py-4 md:py-6"
              )}>
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </MobileOrientationWrapper>
  );
}

