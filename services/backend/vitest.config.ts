import {defineConfig, mergeConfig} from 'vite-plus';
import baseConfig from '../../vite.shared';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'backend',
      setupFiles: ['./src/__tests__/setup.ts'],
      exclude: ['**/build/**', '**/node_modules/**'],
      passWithNoTests: false,
      coverage: {
        enabled: true,
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: ['src/__tests__/**', 'src/types/**', '**/*.test.ts', '**/index.ts'],
        reporter: ['text', 'json-summary', 'html'],
        thresholds: {statements: 80, branches: 80, functions: 80, lines: 80},
      },
    },
  }),
);
