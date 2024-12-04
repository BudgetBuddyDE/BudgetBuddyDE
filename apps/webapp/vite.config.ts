import react from '@vitejs/plugin-react-swc';
import dotenv from 'dotenv';
import path from 'path';
import {defineConfig} from 'vite';
import {ViteEjsPlugin} from 'vite-plugin-ejs';

dotenv.config();

// import dns from 'dns';

// Due to https://stackoverflow.com/a/75191787
// dns.setDefaultResultOrder('verbatim');

const production = process.env.NODE_ENV === 'production';

const SHOW_ENVIRONMENT_DISCLAIMER = process.env.SHOW_ENVIRONMENT_DISCLAIMER || 'false';
const STOCK_SERVICE_HOST = process.env.STOCK_SERVICE_HOST || 'http://localhost:7080';
const MAIL_SERVICE_HOST = process.env.MAIL_SERVICE_HOST;
const POCKETBASE_URL = process.env.POCKETBASE_URL || '';

// https://vitejs.dev/config/
export default defineConfig({
  // https://github.com/vitejs/vite/issues/1973#issuecomment-787571499
  define: {
    'process.env': {
      SHOW_ENVIRONMENT_DISCLAIMER: SHOW_ENVIRONMENT_DISCLAIMER,
      STOCK_SERVICE_HOST: STOCK_SERVICE_HOST,
      MAIL_SERVICE_HOST: MAIL_SERVICE_HOST,
      POCKETBASE_URL: POCKETBASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
  },
  server: {
    open: true,
    host: 'localhost',
    port: 3000,
    proxy: !production
      ? {
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
        }
      : undefined,
  },
  resolve: {
    alias: [{find: '@', replacement: path.resolve(__dirname, 'src')}],
  },
  build: {
    outDir: 'build',
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
