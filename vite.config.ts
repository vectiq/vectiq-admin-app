import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  
  root: './',
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@fonts': path.resolve(__dirname, './public/fonts'),
    },
  },
  server: {
    watch: {
      usePolling: true
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },
  publicDir: 'public'
});