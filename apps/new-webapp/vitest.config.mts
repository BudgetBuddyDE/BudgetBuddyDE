import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import baseConfig from '../../vitest.config';

export default defineConfig({
  ...baseConfig,
  plugins: [...(baseConfig.plugins ?? []), tsconfigPaths(), react()],
  test: {
    ...baseConfig.test,
    name: 'new-webapp',
    environment: 'happy-dom',
    setupFiles: ['./src/vitest.setup.ts'],
    exclude: ['**/build/**', '**/node_modules/**'],
    pool: 'vmThreads',
  },
});
