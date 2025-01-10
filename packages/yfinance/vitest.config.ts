import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // setupFiles: ['./src/__tests__/setupTests.ts'],
    exclude: ['**/lib/**', '**/node_modules/**'],
  },
});
