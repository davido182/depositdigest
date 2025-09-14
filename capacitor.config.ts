
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.rentaflux.app',
  appName: 'RentaFlux',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ff6b35',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    },
    App: {
      launchUrl: 'rentaflux://'
    },
    LiveUpdates: {
      appId: 'com.rentaflux.app',
      channel: 'production',
      autoUpdateMethod: 'background',
      maxVersions: 2,
      enabled: true,
      readyTimeout: 10000,
      checkTimeout: 10000
    }
  }
};

export default config;
