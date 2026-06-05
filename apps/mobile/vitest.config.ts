import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    alias: {
      '@testing-library/react-native': new URL('./src/__mocks__/testing-library-react-native.tsx', import.meta.url).pathname,
      'react-native': new URL('./src/__mocks__/react-native.ts', import.meta.url).pathname,
      'react-native-reanimated': new URL(
        './src/__mocks__/react-native-reanimated.ts',
        import.meta.url,
      ).pathname,
      'expo-location': new URL('./src/__mocks__/expo-location.ts', import.meta.url).pathname,
      'expo-notifications': new URL('./src/__mocks__/expo-notifications.ts', import.meta.url).pathname,
      'expo-device': new URL('./src/__mocks__/expo-device.ts', import.meta.url).pathname,
      'react-native-google-mobile-ads': new URL(
        './src/__mocks__/react-native-google-mobile-ads.ts',
        import.meta.url,
      ).pathname,
      'react-native-safe-area-context': new URL(
        './src/__mocks__/react-native-safe-area-context.ts',
        import.meta.url,
      ).pathname,
      '@expo/vector-icons': new URL(
        './src/__mocks__/expo-vector-icons.tsx',
        import.meta.url,
      ).pathname,
      'expo-clipboard': new URL(
        './src/__mocks__/expo-clipboard.ts',
        import.meta.url,
      ).pathname,
      'expo-router': new URL('./src/__mocks__/expo-router.ts', import.meta.url).pathname,
    },
    environmentMatchGlobs: [
      ['src/shared/ui/**/*.test.tsx', 'jsdom'],
      ['src/features/**/*.test.tsx', 'jsdom'],
    ],
  },
});
