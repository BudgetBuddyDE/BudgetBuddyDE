import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: ['**/lib/**', '**/node_modules/**'],
    coverage: {
      exclude: ['vitest.config.ts', 'lib/**', '**/index.ts'],
    },
  },
});
