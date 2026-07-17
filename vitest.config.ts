import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    silent: 'passed-only',
    environment: 'node',
    exclude: ['**/build/**', '{apps,packages,services}/*/lib/**', '**/node_modules/**'],
    coverage: {
      enabled: false,
      exclude: ['vitest.config.ts', 'build/**', 'lib/**', '**/index.ts'],
    },
    // root: __dirname,
    // projects: ['packages/*'],
  },
});
