import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      'expo-location': new URL('./src/__mocks__/expo-location.ts', import.meta.url).pathname,
      'expo-notifications': new URL('./src/__mocks__/expo-notifications.ts', import.meta.url).pathname,
      'expo-device': new URL('./src/__mocks__/expo-device.ts', import.meta.url).pathname,
      'react-native-google-mobile-ads': new URL(
        './src/__mocks__/react-native-google-mobile-ads.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
