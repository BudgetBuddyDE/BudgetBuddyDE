import {defineConfig, mergeConfig} from 'vite-plus';
import baseConfig, {silentConsole} from '../../vite.shared';

/**
 * Files that intentionally reset the module registry, build real infrastructure
 * clients, or replace whole source modules. They must not share a module graph
 * with the unit suite, so they run in an isolated project.
 */
const isolatedSuites = [
  'src/**/*.integration.test.ts',
  'src/auth.test.ts',
  'src/lib/resend.test.ts',
  'src/server.test.ts',
  'src/mcp/tools.test.ts',
  'src/__tests__/application.rateLimit.test.ts',
  'src/__tests__/application.routes.test.ts',
  'src/__tests__/attachment.handler.test.ts',
  'src/__tests__/executeScheduledRecurringPayment.postgres.test.ts',
  'src/__tests__/infrastructure.test.ts',
  'src/__tests__/insights.router.test.ts',
  'src/__tests__/preference.router.test.ts',
  'src/__tests__/processRecurringPayments.test.ts',
  'src/__tests__/recurringPayment.execute.router.test.ts',
  'src/__tests__/tracingBootstrap.test.ts',
  'src/__tests__/transaction.router.test.ts',
];

const coverage = {
  enabled: true,
  provider: 'v8' as const,
  include: ['src/**/*.ts'],
  exclude: ['src/__tests__/**', 'src/types/**', '**/*.test.ts', '**/index.ts'],
  reporter: ['text', 'json-summary', 'html'],
  thresholds: {statements: 80, branches: 80, functions: 80, lines: 80},
};

const unitSuite = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'backend',
      setupFiles: ['./src/__tests__/setup.ts'],
      // The shared doubles are only safe inside one module graph per worker.
      isolate: false,
      exclude: ['**/build/**', '**/node_modules/**', ...isolatedSuites],
      passWithNoTests: false,
      coverage,
    },
  }),
);

const isolatedSuite = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'backend-integration',
      setupFiles: ['./src/__tests__/setup.integration.ts'],
      // These suites reset modules or exercise real clients on purpose.
      isolate: true,
      include: isolatedSuites,
      exclude: ['**/build/**', '**/node_modules/**'],
      passWithNoTests: false,
      coverage,
    },
  }),
);

// Inline projects extend this container. The reporter reads `silent` from here,
// so set it explicitly; the child projects already inherit it from the merge.
export default defineConfig({
  test: {
    silent: silentConsole,
    projects: [unitSuite, isolatedSuite],
  },
});
