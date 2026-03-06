import { defineNuxtModule, createResolver, addImportsDir, addPlugin, addServerHandler } from "@nuxt/kit";

export interface ModuleOptions {
  courseId: string;
  pathUrl?: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@vch-lt/path",
    configKey: "path",
  },
  defaults: {
    pathUrl: "https://path.vchlearn.ca",
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup(options: ModuleOptions, nuxt: any) {
    const { courseId } = options;
    const pathUrl = options.pathUrl || "https://path.vchlearn.ca";

    if (!courseId) {
      throw new Error('[@vch-lt/path] courseId is required. Set it in nuxt.config: path: { courseId: "..." }');
    }

    // Expose config to runtime files via Nuxt's runtimeConfig system
    nuxt.options.runtimeConfig.public.pathSDK = { courseId, pathUrl };

    // Resolve paths to the runtime files (relative to this file in dist/)
    const resolver = createResolver(import.meta.url);

    // Auto-register the path-token → cookie server middleware
    addServerHandler({
      middleware: true,
      handler: resolver.resolve("./nuxt-runtime/server/middleware/path-token"),
    });

    // Auto-import usePath composable from the runtime directory
    addImportsDir(resolver.resolve("./nuxt-runtime/composables"));

    // Client plugin: read ?path-token= from URL on first load after login
    addPlugin({
      src: resolver.resolve("./nuxt-runtime/plugin.client"),
      mode: "client",
    });
  },
});
