import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusmarket.app',
  appName: 'Campus Market',
  webDir: 'out',
  server: {
    url: 'https://campusmarketp2p.com.ng',
    cleartext: true
  }
};

export default config;
