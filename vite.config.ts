import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // Build configuration for library mode
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PathSDK',
      formats: ['es'],
      fileName: (format) => `index.js`
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Preserve the exports structure
        preserveModules: false,
      }
    }
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  // Server configuration
  server: {
    port: 5500,
    open: true
  }
});
