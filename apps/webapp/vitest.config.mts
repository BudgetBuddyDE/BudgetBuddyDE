import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from "../../vitest.config"
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default mergeConfig(baseConfig, defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    name: "webapp",
    // happy-dom is significantly faster than jsdom for environment setup
    // and DOM operations while remaining fully compatible with @testing-library/react
    environment: "happy-dom",
    setupFiles: ["./src/vitest.setup.ts"],
    // vmThreads uses Node.js Worker Threads instead of child processes,
    // which reduces per-worker startup overhead
    pool: "vmThreads",
    deps: {
      optimizer: {
        // Pre-bundle heavy web dependencies (MUI, React, etc.) into fast ESM
        // chunks on first run; subsequent runs reuse the cache and skip
        // per-file re-transformation of node_modules
        web: {
          enabled: true,
        },
      },
    },
  },
}));
