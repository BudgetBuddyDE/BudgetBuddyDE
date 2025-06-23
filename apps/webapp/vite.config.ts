import {getLogLevel} from '@budgetbuddyde/utils/';
import react from '@vitejs/plugin-react-swc';
import 'dotenv/config';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {ViteEjsPlugin} from 'vite-plugin-ejs';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the
  // `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // TODO: Evaluate if we need to use this
    // define: {
    //   __APP_ENV__: JSON.stringify(env.APP_ENV),
    // },
    server: {
      open: true,
      host: 'localhost',
      port: 3000,
    },
    resolve: {
      alias: [{find: '@', replacement: path.resolve(__dirname, 'src')}],
    },
    build: {
      outDir: 'dist',
    },
    plugins: [
      react(),
      ViteEjsPlugin(config => {
        return {
          ...config,
          isProd: config.mode === 'production',
        };
      }),
    ],
  };
});
