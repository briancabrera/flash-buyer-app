import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.flashbuyerapp.mobile',
  appName: 'Flash Buyer',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
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

