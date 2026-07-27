import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  plugins: [vue()],
  // Build configuration for library mode
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/typescript/index.ts"),
        "next-server": resolve(__dirname, "src/typescript/next-server.ts"),
        "next-client": resolve(__dirname, "src/typescript/next-client.ts"),
        server: resolve(__dirname, "src/typescript/server.ts"),
        nuxt: resolve(__dirname, "src/typescript/nuxt.ts"),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Framework deps are provided by the consuming app — don't bundle them
      // Framework deps + sibling entries that must stay as separate modules
      external: ["next/headers", "next/server", "next/navigation", "h3", "@nuxt/kit", "react", "./next-client.js"],
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/typescript"),
    },
  },

  // Server configuration
  server: {
    port: 5500,
  },
  root: resolve(__dirname, "examples/typescript"),
});
