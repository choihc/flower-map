import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      'expo-location': new URL('./src/__mocks__/expo-location.ts', import.meta.url).pathname,
    },
  },
});
