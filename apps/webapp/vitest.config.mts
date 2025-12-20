import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from "../../vitest.config"
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default mergeConfig(baseConfig, defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    name: "webapp",
    environment: "jsdom"
  }
}));
