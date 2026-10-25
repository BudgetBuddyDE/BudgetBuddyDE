import {defineConfig, mergeConfig} from 'vite-plus';
import baseConfig from '../../vite.shared';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'core',
      exclude: ['**/lib/**', '**/node_modules/**'],
    },
  }),
);
