
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useDeviceFeatures } from "@/hooks/use-device-features";
import {
  Camera,
  Fingerprint,
  Lock,
  Smartphone,
  BellRing,
  FileText,
  CloudOff
} from "lucide-react";

export function MobileFeatureToggle() {
  const { isNative, platform } = useDeviceFeatures();
  const [features, setFeatures] = useState({
    biometricAuth: false,
    cameraUpload: true,
    pushNotifications: true,
    documentScanning: true,
    offlineMode: true,
    secureStorage: true
  });

  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  if (!isNative) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Mobile Features</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Configure features specific to your {platform === 'ios' ? 'iOS' : 'Android'} device.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="biometric-auth" className="cursor-pointer">Biometric Authentication</Label>
          </div>
          <Switch
            id="biometric-auth"
            checked={features.biometricAuth}
            onCheckedChange={() => toggleFeature('biometricAuth')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="camera-upload" className="cursor-pointer">Camera Upload</Label>
          </div>
          <Switch
            id="camera-upload"
            checked={features.cameraUpload}
            onCheckedChange={() => toggleFeature('cameraUpload')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellRing className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="push-notifications" className="cursor-pointer">Push Notifications</Label>
          </div>
          <Switch
            id="push-notifications"
            checked={features.pushNotifications}
            onCheckedChange={() => toggleFeature('pushNotifications')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="document-scanning" className="cursor-pointer">Document Scanning</Label>
          </div>
          <Switch
            id="document-scanning"
            checked={features.documentScanning}
            onCheckedChange={() => toggleFeature('documentScanning')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CloudOff className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="offline-mode" className="cursor-pointer">Offline Mode</Label>
          </div>
          <Switch
            id="offline-mode"
            checked={features.offlineMode}
            onCheckedChange={() => toggleFeature('offlineMode')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="secure-storage" className="cursor-pointer">Secure Local Storage</Label>
          </div>
          <Switch
            id="secure-storage"
            checked={features.secureStorage}
            onCheckedChange={() => toggleFeature('secureStorage')}
          />
        </div>
      </div>
    </div>
  );
}
