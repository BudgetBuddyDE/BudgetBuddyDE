import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import {defineConfig, mergeConfig} from 'vitest/config';
import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
      name: 'webapp-v2',
      environment: 'happy-dom',
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['**/.next/**', '**/build/**', '**/node_modules/**'],
      setupFiles: ['./src/vitest.setup.ts'],
      pool: 'vmThreads',
    },
  }),
);
