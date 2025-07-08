
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { OfflineBanner } from "./ui/offline-banner";
import { useDeviceFeatures } from "@/hooks/use-device-features";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { isNative, platform } = useDeviceFeatures();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    setMounted(true);
    console.log("Layout component mounted");
    
    if (isNative) {
      console.log(`Running on native ${platform} platform`);
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
      <div className="min-h-screen bg-background">
        <OfflineBanner />
        <div className="container max-w-7xl mx-auto py-4 md:py-6 space-y-6 md:space-y-8">
          {children}
        </div>
      </div>
    );
  }

  console.log("Layout: User authenticated, showing sidebar + children");
  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <OfflineBanner />
        <div className="container max-w-7xl mx-auto py-4 md:py-6 space-y-6 md:space-y-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
