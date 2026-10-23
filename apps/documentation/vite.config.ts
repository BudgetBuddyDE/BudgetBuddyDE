import tailwindcss from '@tailwindcss/vite';
import {fumadocsMdx} from 'fumadocs-mdx/vite';
import press from 'fumapress/vite';
import {defineConfig, lazyPlugins} from 'vite-plus';

export default defineConfig({
  server: {
    port: 3080,
  },
  plugins: lazyPlugins(() => [press(), fumadocsMdx(), tailwindcss()]),
});
