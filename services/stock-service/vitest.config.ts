import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./src/__tests__/setupTests.ts'],
    exclude: ['**/build/**', '**/node_modules/**'],
  },
  define: {
    'process.env': {
      NODE_ENV: 'test',
    },
  },
});
