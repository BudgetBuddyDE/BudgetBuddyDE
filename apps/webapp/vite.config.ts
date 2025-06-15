import {getLogLevel} from '@budgetbuddyde/utils/';
import react from '@vitejs/plugin-react-swc';
import 'dotenv/config';
import path from 'path';
import {defineConfig} from 'vite';
import {ViteEjsPlugin} from 'vite-plugin-ejs';

// import dns from 'dns';

// Due to https://stackoverflow.com/a/75191787
// dns.setDefaultResultOrder('verbatim');

const {
  NODE_ENV,
  SHOW_ENVIRONMENT_DISCLAIMER,
  AUTH_SERVICE_HOST,
  BACKEND_HOST,
  POCKETBASE_URL,
  STOCK_SERVICE_HOST,
  MAIL_SERVICE_HOST,
} = process.env;
const production = NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig({
  // https://github.com/vitejs/vite/issues/1973#issuecomment-787571499
  define: {
    'process.env': {
      SHOW_ENVIRONMENT_DISCLAIMER: SHOW_ENVIRONMENT_DISCLAIMER || 'false',
      STOCK_SERVICE_HOST: STOCK_SERVICE_HOST || 'http://localhost:7080',
      MAIL_SERVICE_HOST: MAIL_SERVICE_HOST || 'https://localhost:7070',
      POCKETBASE_URL: POCKETBASE_URL || 'https://localhost:7060',
      AUTH_SERVICE_HOST: AUTH_SERVICE_HOST,
      BACKEND_HOST: BACKEND_HOST,
      NODE_ENV: NODE_ENV,
      LOG_LEVEL: getLogLevel(),
    },
  },
  server: {
    open: true,
    host: 'localhost',
    port: 3000,
    proxy: production
      ? undefined
      : {
          '/auth_service': {
            target: AUTH_SERVICE_HOST,
            changeOrigin: true,
            rewrite: path => path.replace('/auth_service', ''),
          },
          '/backend': {
            target: BACKEND_HOST,
            changeOrigin: true,
            rewrite: path => path.replace('/backend', ''),
          },
          '/stock_service': {
            target: STOCK_SERVICE_HOST,
            changeOrigin: true,
            rewrite: path => path.replace('/stock_service', ''),
          },
          '/mail_service': {
            target: MAIL_SERVICE_HOST,
            changeOrigin: true,
            rewrite: path => path.replace('/mail_service', ''),
          },
          // "/socket": {
          //   target: "http://localhost:7070",
          //   changeOrigin: true,
          //   ws: true,
          //   rewrite: (path) => path.replace("/socket", ""),
          // },
        },
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
});
