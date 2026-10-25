import {defineConfig, mergeConfig} from 'vite-plus';
import baseConfig from '../../vite.shared';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'logger',
      exclude: ['**/lib/**', '**/node_modules/**'],
    },
  }),
);
