import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.flashbuyerapp.mobile',
  appName: 'Flash Buyer',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Camera: {
      permissionDescription: 'Se necesita acceso a la cámara para el reconocimiento facial.'
    }
  },
  android: {
    backgroundColor: "#3880ff"
  },
  ios: {
    backgroundColor: "#3880ff"
  }
};

export default config;

