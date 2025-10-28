import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from "../../vitest.config"

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: "auth-service",
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/build/**', '**/node_modules/**'],
  }
}));

