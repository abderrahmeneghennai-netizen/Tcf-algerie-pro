import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/v4/app',
  base: './',
  build: {
    outDir: '../../../dist',
    emptyOutDir: true
  }
});
