
import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function useDeviceFeatures() {
  const [isNative, setIsNative] = useState<boolean>(false);
  const [platform, setPlatform] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{
    isOnline: boolean;
    batteryLevel?: number;
  }>({
    isOnline: true,
  });

  useEffect(() => {
    // Check if running in a native environment
    const checkPlatform = async () => {
      setIsNative(Capacitor.isNativePlatform());
      setPlatform(Capacitor.getPlatform());
    };

    // Check connectivity status
    const updateOnlineStatus = () => {
      setDeviceInfo(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));
    };

    // Initialize platform and online status
    checkPlatform();
    updateOnlineStatus();

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return {
    isNative,
    platform,
    deviceInfo
  };
}
