
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8d19717d812d442e879aca561313dd86',
  appName: 'RentFlow',
  webDir: 'dist',
  server: {
    url: "https://8d19717d-812d-442e-879a-ca561313dd86.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  },
  android: {
    captureInput: true
  }
};

export default config;
