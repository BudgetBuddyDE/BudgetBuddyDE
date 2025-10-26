import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    silent: 'passed-only',
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/build/**', '**/node_modules/**'],
  },
});
