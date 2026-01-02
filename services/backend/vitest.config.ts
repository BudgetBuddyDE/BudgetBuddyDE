import {defineConfig, mergeConfig} from 'vitest/config';
import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'backend',
      setupFiles: ['./src/__tests__/setup.ts'],
      exclude: ['**/build/**', '**/node_modules/**'],
      passWithNoTests: false,
      // Run tests sequentially to avoid data conflicts
      fileParallelism: false,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  }),
);

