import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';
import press from 'fumapress/vite';
import {fumadocsMdx} from 'fumadocs-mdx/vite';

export default defineConfig({
  server: {
    port: 3080,
  },
  plugins: [press(), fumadocsMdx(), tailwindcss()],
});
