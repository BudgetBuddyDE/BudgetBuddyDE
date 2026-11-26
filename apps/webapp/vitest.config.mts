import {defineConfig, mergeConfig} from 'vite-plus';
import baseConfig from '../../vite.shared';
import react from '@vitejs/plugin-react';

/**
 * Suites that register global tracing providers, reset the module registry,
 * or replace native fetch on purpose. They must not share a module graph with
 * the unit suite, because their instrumentation would leak into later files.
 */
const isolatedSuites = [
  'src/browserPropagation.test.ts',
  'src/instrumentation.node.test.ts',
  'src/instrumentation.test.ts',
  'src/undiciPropagation.test.ts',
];

const createProject = (name: string, isolate: boolean, include?: string[]) =>
  mergeConfig(
    baseConfig,
    defineConfig({
      // Only this local React package uses source resolution. A global dev-source
      // condition would also select unpublished source files in Better Auth.
      resolve: {
        tsconfigPaths: true,
        alias: {'@budgetbuddyde/charts': new URL('../../packages/charts/src/index.ts', import.meta.url).pathname},
      },
      plugins: [react()],
      test: {
        name,
        include,
        exclude: include
          ? ['**/build/**', '**/node_modules/**']
          : ['**/build/**', '**/node_modules/**', ...isolatedSuites],
        // happy-dom is significantly faster than jsdom for environment setup
        // and DOM operations while remaining fully compatible with @testing-library/react
        environment: 'happy-dom',
        setupFiles: ['./src/vitest.setup.ts'],
        isolate,
        // VM workers exhaust Windows file handles while loading the MUI icon barrel.
        pool: 'forks',
        maxWorkers: 6,
        // Vitest requires a separate execution group for this project's worker limit.
        sequence: {groupOrder: 1},
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

export default defineConfig({
  test: {
    projects: [createProject('webapp', false), createProject('webapp-integration', true, isolatedSuites)],
  },
});
