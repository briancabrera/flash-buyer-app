import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.flashvendorapp.mobile',
  appName: 'Flash Vendor',
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

