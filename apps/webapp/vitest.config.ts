import path from 'path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsxInject: "import React from 'react'",
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: [{find: '@', replacement: path.resolve(__dirname, 'src')}],
  },
  define: {
    'process.env': {
      NODE_ENV: 'test',
    },
  },
});
