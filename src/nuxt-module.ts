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

    // 3. Auto-import usePath — universal composable that works on server and client transparently
    const composableTemplate = addTemplate({
      filename: 'path-sdk/composable.ts',
      write: true,
      getContents: () => `
import { useAsyncData, useRequestEvent } from '#app';
import pathSDK from '@vch-lt/path';
import { pathNuxtSDK as _pathNuxtSDK } from '@vch-lt/path/nuxt';
import type { MilestoneValue } from '@vch-lt/path';

const _config = { courseId: '${courseId}', pathUrl: '${pathUrl}' };

function _serverSDK() {
  return _pathNuxtSDK(useRequestEvent(), _config);
}
function _clientSDK() {
  return pathSDK({ ..._config, courseUrl: window.location.origin });
}

/**
 * Universal Path composable. Works in pages, components, and layouts.
 * Reads auth from the server cookie on SSR; reads from the browser cookie on the client.
 * Data-fetching methods use useAsyncData to avoid double-fetching during hydration.
 *
 * @example
 * const { data: auth } = await usePath().checkAuth();
 * if (!auth.value?.isAuthenticated) usePath().login(window.location.href);
 */
export const usePath = () => ({
  /** Check auth status. SSR-safe — result is shared between server and client. */
  checkAuth: () =>
    useAsyncData('path-auth', async () =>
      import.meta.server
        ? (await _serverSDK()).checkAuth()
        : _clientSDK().checkAuth()
    ),

  /** Get full enrollment and progress data. SSR-safe. */
  getEnrollmentAndProgress: () =>
    useAsyncData('path-enrollment', async () =>
      import.meta.server
        ? (await _serverSDK()).getEnrollmentAndProgress()
        : _clientSDK().getEnrollmentAndProgress()
    ),

  /** Submit a milestone progress value. Works on server and client. */
  submitProgress: async (milestoneSlug: string, value: MilestoneValue) =>
    import.meta.server
      ? (await _serverSDK()).submitProgress(milestoneSlug, value)
      : _clientSDK().submitProgress(milestoneSlug, value),

  /** Redirect to the Path login page. Client-only. */
  login: (callbackUrl?: string) => {
    if (import.meta.client) _clientSDK().login(callbackUrl);
  },

  /** Clear the session and log out. Client-only. */
  logout: async () => {
    if (import.meta.client) await _clientSDK().logout();
  },
});
`.trim(),
    });

    addImports({ name: 'usePath', from: composableTemplate.dst });

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
