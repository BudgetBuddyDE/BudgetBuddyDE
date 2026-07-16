import react from '@vitejs/plugin-react';
import {defineConfig, mergeConfig} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
      name: 'new-webapp',
      environment: 'happy-dom',
      setupFiles: ['./src/vitest.setup.ts'],
      pool: 'vmThreads',
    },
  }),
);
