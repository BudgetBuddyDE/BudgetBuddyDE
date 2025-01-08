import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setupTests.ts'],
    exclude: ['**/build/**', '**/node_modules/**'],
  },
});
