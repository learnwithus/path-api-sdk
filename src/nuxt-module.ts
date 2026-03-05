import { defineNuxtModule, addImports, addPlugin, addTemplate, addServerHandler } from '@nuxt/kit';

export interface ModuleOptions {
  courseId: string;
  pathUrl?: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@vch-lt/path',
    configKey: 'path',
  },
  defaults: {
    pathUrl: 'https://path.vchlearn.ca',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup(options: ModuleOptions, _nuxt: any) {
    const { courseId } = options;
    const pathUrl = options.pathUrl || 'https://path.vchlearn.ca';

    if (!courseId) {
      throw new Error('[@vch-lt/path] courseId is required. Set it in nuxt.config: path: { courseId: "..." }');
    }

    // 1. Auto-register the path-token → cookie server middleware
    const middlewareTemplate = addTemplate({
      filename: 'path-sdk/middleware.ts',
      write: true,
      getContents: () => `
import { defineEventHandler, getCookie, setCookie, getQuery } from 'h3';
const TOKEN_STORAGE_KEY = 'path_bearer_token';
const PATH_TOKEN_CONTEXT_KEY = 'pathToken';
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = typeof query['path-token'] === 'string' ? query['path-token'] : undefined;
  if (!token) return;
  setCookie(event, TOKEN_STORAGE_KEY, token, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  event.context[PATH_TOKEN_CONTEXT_KEY] = token;
});
`.trim(),
    });

    addServerHandler({ middleware: true, handler: middlewareTemplate.dst });

    // 2. Auto-import pathNuxtSDK (pre-configured with courseId — use in server routes)
    const serverTemplate = addTemplate({
      filename: 'path-sdk/server.ts',
      write: true,
      getContents: () => `
import { pathNuxtSDK as _pathNuxtSDK } from '@vch-lt/path/nuxt';
/** Pre-configured Path server SDK. Use in Nuxt server routes and event handlers. */
export const pathNuxtSDK = (event: any) => _pathNuxtSDK(event, { courseId: '${courseId}', pathUrl: '${pathUrl}' });
`.trim(),
    });

    addImports({ name: 'pathNuxtSDK', from: serverTemplate.dst });

    // 3. Auto-import usePathSDK composable (pre-configured — use in components and composables)
    const composableTemplate = addTemplate({
      filename: 'path-sdk/composable.ts',
      write: true,
      getContents: () => `
import pathSDK from '@vch-lt/path';
/** Pre-configured Path client SDK. Use in Vue components and composables. */
export const usePathSDK = () => pathSDK({
  courseId: '${courseId}',
  pathUrl: '${pathUrl}',
  courseUrl: typeof window !== 'undefined' ? window.location.origin : '',
});
`.trim(),
    });

    addImports({ name: 'usePathSDK', from: composableTemplate.dst });

    // 4. Client plugin: read ?path-token= from URL on first load after login and store in cookie
    const pluginTemplate = addTemplate({
      filename: 'path-sdk/plugin.client.ts',
      write: true,
      getContents: () => `
import { defineNuxtPlugin } from '#app';
import { setToken } from '@vch-lt/path';
export default defineNuxtPlugin(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('path-token');
  if (token) {
    setToken(token);
    params.delete('path-token');
    const search = params.toString() ? '?' + params.toString() : '';
    window.history.replaceState(null, '', window.location.pathname + search + window.location.hash);
  }
});
`.trim(),
    });

    addPlugin({ src: pluginTemplate.dst, mode: 'client' });
  },
});
