import { AlertCircle, WifiOff } from "lucide-react";
import { useDeviceFeatures } from "@/hooks/use-device-features";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function OfflineBanner() {
  const { deviceInfo } = useDeviceFeatures();
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    if (!deviceInfo.isOnline) {
      setShowBanner(true);
    } else {
      // Keep banner visible for a moment when coming back online
      if (showBanner) {
        const timer = setTimeout(() => {
          setShowBanner(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [deviceInfo.isOnline, showBanner]);
  
  if (!showBanner) return null;
  
  return (
    <Alert 
      variant={deviceInfo.isOnline ? "default" : "destructive"}
      className="fixed top-0 left-0 right-0 z-50 animate-fade-in"
    >
      {deviceInfo.isOnline ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Restored</AlertTitle>
          <AlertDescription>
            You're back online. All changes will now sync.
          </AlertDescription>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You're Offline</AlertTitle>
          <AlertDescription>
            Some features may be limited. We'll sync your changes when you're back online.
          </AlertDescription>
        </>
      )}
    </Alert>
  );
}
