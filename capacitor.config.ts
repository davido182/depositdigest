
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.8d19717d812d442e879aca561313dd86',
  appName: 'RentFlow',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://8d19717d-812d-442e-879a-ca561313dd86.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
