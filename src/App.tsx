import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthDebugger from "@/components/AuthDebugger";
import Index from "./pages/Index";
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
import { useEffect, useRef } from "react";
import { App as CapApp } from "@capacitor/app";
import { useDeviceFeatures } from "./hooks/use-device-features";

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
  console.log("🚀 App component rendering - auth fix version");
  const { isNative } = useDeviceFeatures();
  const listenerRef = useRef<any>(null);
  
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
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/tenant-signup" element={<TenantSignup />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/accounting" element={<Accounting />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/invite-tenant" element={<InviteTenant />} />
        <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AuthDebugger />
          </BrowserRouter>
          <Toaster />
          <Sonner position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
