import {defineConfig, mergeConfig} from 'vitest/config';
import baseConfig from '../../vitest.config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
      name: 'webapp',
      exclude: ['**/build/**', '**/node_modules/**'],
      // happy-dom is significantly faster than jsdom for environment setup
      // and DOM operations while remaining fully compatible with @testing-library/react
      environment: 'happy-dom',
      setupFiles: ['./src/vitest.setup.ts'],
      // vmThreads uses Node.js Worker Threads instead of child processes,
      // which reduces per-worker startup overhead
      pool: 'vmThreads',
      fileParallelism: false,
      poolOptions: {
        vmThreads: {
          minThreads: 1,
          maxThreads: 4,
        },
      },
      deps: {
        optimizer: {
          // Avoid opening the entire MUI icon package on constrained CI/Windows workers.
          web: {enabled: false},
        },
      },
    },
  }),
);
