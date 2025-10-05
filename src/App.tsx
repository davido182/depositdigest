import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthDebugger from "@/components/AuthDebugger";
import { DevToolsPanel } from "@/hooks/useDevTools";
import { DevErrorNotice } from "@/components/ui/DevErrorNotice";
import { SmartHome } from "@/components/SmartHome";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import Properties from "./pages/Properties";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Maintenance from "./pages/Maintenance";
import Accounting from "./pages/Accounting";
import Assistant from "./pages/Assistant";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import TenantSignup from "./pages/TenantSignup";
import InviteTenant from "./pages/InviteTenant";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import PaymentSuccess from "./pages/PaymentSuccess";
import Landing from "./pages/Landing";
import { useEffect, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { useDeviceFeatures } from "./hooks/use-device-features";
import { logger } from "@/utils/logger";
import { config } from "@/utils/config";
import { liveUpdatesService } from "@/services/LiveUpdatesService";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";
import { Layout } from "lucide-react";

// Create a new query client instance with simplified configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App = () => {
  logger.info("🚀 RentaFlux App initializing", {
    version: config.app.version,
    environment: config.app.environment
  });

  const { isNative } = useDeviceFeatures();
  const listenerRef = useRef<any>(null);
  const [hasVisitedBefore, setHasVisitedBefore] = useState<boolean | null>(null);

  // Check if user has visited before
  useEffect(() => {
    const checkFirstVisit = () => {
      const hasVisited = localStorage.getItem('rentaflux_has_visited');
      setHasVisitedBefore(!!hasVisited);

      if (!hasVisited) {
        localStorage.setItem('rentaflux_has_visited', 'true');
      }
    };

    checkFirstVisit();
  }, []);

  // Listen for hardware back button on native apps
  useEffect(() => {
    if (isNative) {
      const setupListener = async () => {
        // Store the listener handle in the ref
        listenerRef.current = await CapApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // Handle exit app confirmation or navigation to home
            CapApp.exitApp();
          }
        });
      };

      setupListener();

      return () => {
        // Clean up the listener when component unmounts
        if (listenerRef.current) {
          listenerRef.current.remove();
        }
      };
    }
  }, [isNative]);

  // Initialize Live Updates service
  useEffect(() => {
    if (isNative) {
      liveUpdatesService.initialize().catch(error => {
        logger.error('Failed to initialize Live Updates:', error);
      });

      return () => {
        liveUpdatesService.cleanup();
      };
    }
  }, [isNative]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SmartHome />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/tenant-signup" element={<TenantSignup />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/app" element={<Layout><Dashboard /></Layout>} />
                <Route path="/properties" element={<Layout><Properties /></Layout>} />
                <Route path="/tenants" element={<Layout><Tenants /></Layout>} />
                <Route path="/payments" element={<Layout><Payments /></Layout>} />
                <Route path="/maintenance" element={<Layout><Maintenance /></Layout>} />
                <Route path="/accounting" element={<Layout><Accounting /></Layout>} />
                <Route path="/assistant" element={<Layout><Assistant /></Layout>} />
                <Route path="/reports" element={<Layout><Reports /></Layout>} />
                <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
                <Route path="/settings" element={<Layout><Settings /></Layout>} />
                <Route path="/invite-tenant" element={<Layout><InviteTenant /></Layout>} />
                <Route path="/subscription-success" element={<Layout><SubscriptionSuccess /></Layout>} />
                <Route path="/payment-success" element={<Layout><PaymentSuccess /></Layout>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AuthDebugger />
          </BrowserRouter>
          <Toaster />
          <Sonner position="top-right" />
          {/* <DevToolsPanel /> */}
          <DevErrorNotice />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
