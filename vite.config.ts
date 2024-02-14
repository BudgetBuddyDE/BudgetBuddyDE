import dotenv from 'dotenv';
dotenv.config();

import { defineConfig } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
// import dns from 'dns';

// Due to https://stackoverflow.com/a/75191787
// dns.setDefaultResultOrder('verbatim');

const production = process.env.NODE_ENV === 'production';

const BACKEND_HOST = process.env.BACKEND_HOST || 'http://localhost:8080';
const FILE_SERVICE_HOST = process.env.FILE_SERVICE_HOST || 'http://localhost:8090';

// https://vitejs.dev/config/
export default defineConfig({
  // https://github.com/vitejs/vite/issues/1973#issuecomment-787571499
  define: {
    'process.env': {
      BACKEND_HOST: BACKEND_HOST,
      FILE_SERVICE_HOST: FILE_SERVICE_HOST,
      NODE_ENV: process.env.NODE_ENV,
    },
  },
  server: {
    open: true,
    host: 'localhost',
    port: 3000,
    proxy: !production
      ? {
          '/api': {
            target: BACKEND_HOST,
            changeOrigin: true,
            rewrite: (path) => path.replace('/api', ''),
          },
          '/file': {
            target: FILE_SERVICE_HOST,
            changeOrigin: true,
            rewrite: (path) => path.replace('/file', ''),
          },
        }
      : undefined,
  },
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  build: {
    outDir: 'build',
  },
  plugins: [
    react(),
    ViteEjsPlugin((config) => {
      return {
        ...config,
        isProd: config.mode === 'production',
      };
    }),
  ],
});
