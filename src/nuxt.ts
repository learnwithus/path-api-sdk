import { TOKEN_STORAGE_KEY } from "./fetch-helper.js";
import { createServerSDK } from "./server-core.js";
import type { ServerSDKConfig, ServerSDKInstance } from "./server-core.js";

export type { ServerSDKInstance };
export type { Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from "./types.js";
export type { ServerSDKConfig } from "./server-core.js";
export { TOKEN_STORAGE_KEY } from "./fetch-helper.js";

// Internal context key for passing token from middleware to route handlers
const PATH_TOKEN_CONTEXT_KEY = "pathToken";

/**
 * Nuxt/H3 server middleware that intercepts the ?path-token= query param on redirect from Path login.
 *
 * On the first page load after login the bearer token arrives as ?path-token= in the URL.
 * Without this middleware, the cookie isn't set until client-side JS runs, so the first
 * SSR render would see an unauthenticated request.
 *
 * This middleware handles it with no redirect:
 * 1. Reads ?path-token= from the URL
 * 2. Sets the bearer token cookie on the response (available for all future requests)
 * 3. Stores the token in event.context so the current SSR render can access it immediately
 *
 * Add to server/middleware/path-token.ts in your Nuxt project:
 * ```ts
 * import { createPathH3Middleware } from '@vch-lt/path/nuxt';
 * export default createPathH3Middleware();
 * ```
 *
 * If you have your own middleware, compose them:
 * ```ts
 * import { createPathH3Middleware } from '@vch-lt/path/nuxt';
 * const handlePath = createPathH3Middleware();
 *
 * export default defineEventHandler(async (event) => {
 *   await handlePath(event);
 *   // ... your own logic
 * });
 * ```
 */
export function createPathH3Middleware() {
  return async function pathMiddleware(event: any) {
    const { getCookie, setCookie, getQuery } = await import("h3");
    const query = getQuery(event);
    const token = typeof query["path-token"] === "string" ? query["path-token"] : undefined;
    if (!token) return;

    // Set cookie for all future requests
    setCookie(event, TOKEN_STORAGE_KEY, token, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Store in event context so the current SSR render is authenticated without a redirect
    event.context[PATH_TOKEN_CONTEXT_KEY] = token;
  };
}

/**
 * Create a Path SDK instance for use in Nuxt server routes and SSR.
 * Automatically reads the bearer token from the H3 event context (set by createPathH3Middleware
 * on the first request after login) or from the request cookie.
 *
 * @example
 * ```ts
 * // server/api/progress.get.ts
 * import { pathNuxtSDK } from '@vch-lt/path/nuxt';
 *
 * export default defineEventHandler(async (event) => {
 *   const path = await pathNuxtSDK(event, { courseId: 'your-course-id' });
 *   return path.getEnrollmentAndProgress();
 * });
 * ```
 *
 * @example
 * ```ts
 * // app/server/api/auth.get.ts (used by a page via useFetch)
 * import { pathNuxtSDK } from '@vch-lt/path/nuxt';
 *
 * export default defineEventHandler(async (event) => {
 *   const path = await pathNuxtSDK(event, { courseId: 'your-course-id' });
 *   return path.checkAuth();
 * });
 * ```
 */
export async function pathNuxtSDK(event: any, config: ServerSDKConfig): Promise<ServerSDKInstance> {
  const { getCookie } = await import("h3");

  // Prefer context (set by middleware on first request); fall back to cookie
  const token: string | null = event.context[PATH_TOKEN_CONTEXT_KEY] ?? getCookie(event, TOKEN_STORAGE_KEY) ?? null;

  return createServerSDK(config, token);
}
