import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.riotsheets.app',
  appName: 'RIOT SHEETS',
  webDir: 'dist',
  server: {
    // In production, the app loads from the bundled dist/ files.
    // API calls go to the Worker via the full URL in src/lib/api.ts
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
    Haptics: {
      // Vibrate on recording start/stop
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set when signing for release
      keystoreAlias: undefined,
    },
  },
};

export default config;
