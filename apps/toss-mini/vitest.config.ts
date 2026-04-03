import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    alias: {
      '@testing-library/react-native': new URL(
        './src/__mocks__/testing-library-react-native.ts',
        import.meta.url,
      ).pathname,
    },
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
