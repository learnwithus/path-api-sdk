import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Build configuration for library mode
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LearnerAPISDK',
      formats: ['es'],
      fileName: (format) => `index.js`
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: [],
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
