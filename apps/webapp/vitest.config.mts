import {defineConfig, mergeConfig} from 'vite-plus';
import baseConfig from '../../vite.shared';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default mergeConfig(
  baseConfig,
  defineConfig({
    // Only this local React package uses source resolution. A global dev-source
    // condition would also select unpublished source files in Better Auth.
    resolve: {
      alias: {'@budgetbuddyde/charts': new URL('../../packages/charts/src/index.ts', import.meta.url).pathname},
    },
    plugins: [tsconfigPaths(), react()],
    test: {
      name: 'webapp',
      exclude: ['**/build/**', '**/node_modules/**'],
      // happy-dom is significantly faster than jsdom for environment setup
      // and DOM operations while remaining fully compatible with @testing-library/react
      environment: 'happy-dom',
      setupFiles: ['./src/vitest.setup.ts'],
      // VM workers exhaust Windows file handles while loading the MUI icon barrel.
      pool: 'forks',
      maxWorkers: 2,
      deps: {
        optimizer: {
          // Pre-bundle heavy web dependencies (MUI, React, etc.) into fast ESM
          // chunks on first run; subsequent runs reuse the cache and skip
          // per-file re-transformation of node_modules
          client: {
            enabled: true,
            include: ['recharts'],
          },
        },
      },
    },
  }),
);
