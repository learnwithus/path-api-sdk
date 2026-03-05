import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  // Build configuration for library mode
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        next: resolve(__dirname, 'src/next.ts'),
        server: resolve(__dirname, 'src/server.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // next/headers is provided by the consuming Next.js app — don't bundle it
      external: ['next/headers'],
    },
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
