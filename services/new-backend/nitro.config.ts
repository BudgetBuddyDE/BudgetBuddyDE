import {defineNitroConfig} from 'nitropack/config';

export default defineNitroConfig({
  compatibilityDate: '2026-11-22',
  preset: 'node-server',
  output: {dir: 'build'},
});
