import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const mock = (p: string) =>
  fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': mock('./src'),
      'react-native': mock('./src/__mocks__/react-native.tsx'),
      '@toss/tds-react-native': mock('./src/__mocks__/@toss/tds-react-native.tsx'),
      '@apps-in-toss/framework': mock('./src/__mocks__/@apps-in-toss/framework.ts'),
      '@granite-js/react-native': mock('./src/__mocks__/@granite-js/react-native.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
