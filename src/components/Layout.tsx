
import SimpleSidebar from "./SimpleSidebar";
import { useState, useEffect } from "react";
import { OfflineBanner } from "./ui/offline-banner";
import { useDeviceFeatures } from "@/hooks/use-device-features";
import { useOrientation } from "@/hooks/use-orientation";
import { useAuth } from "@/contexts/AuthContext";
// Removed shadcn sidebar components
import { MobileOrientationWrapper } from "./MobileOrientationWrapper";
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
    console.log("Layout component mounted");
    
    if (isNative) {
      console.log(`Running on native ${platform} platform`);
      // Inicializar Live Updates solo en plataformas nativas
      liveUpdatesService.initialize().catch(error => {
        console.error("Error initializing Live Updates:", error);
      });
    } else {
      console.log("Running in browser");
    }
  }, [isNative, platform]);

  useEffect(() => {
    console.log("Layout auth state:", { isAuthenticated, isLoading, user: user?.email });
  }, [isAuthenticated, isLoading, user]);

  if (!mounted) {
    console.log("Layout not mounted yet");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading while auth is being determined
  if (isLoading) {
    console.log("Layout showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only show sidebar if user is authenticated
  if (!isAuthenticated) {
    console.log("Layout: User not authenticated, showing children only");
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

  console.log("Layout: User authenticated, showing sidebar + children");
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
              <div className="ml-auto">
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
