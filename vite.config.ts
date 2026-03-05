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
        nuxt: resolve(__dirname, 'src/nuxt.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // next/headers and h3 are provided by the consuming app — don't bundle them
      external: ['next/headers', 'h3'],
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
