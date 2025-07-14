import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.indiancinema.hub',
  appName: 'Indian Cinema Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#001529',
    buildOptions: {
      minSdkVersion: 24,
      targetSdkVersion: 34
    }
  }
};

export default config;
