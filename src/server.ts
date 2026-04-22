import { createServerSDK, exchangeHandoffCode } from "./server-core.js";
import type { ServerSDKConfig, ServerSDKInstance } from "./server-core.js";

export type { ServerSDKInstance };
export type { Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from "./types.js";
export type { ServerSDKConfig } from "./server-core.js";
export { TOKEN_STORAGE_KEY } from "./constants.js";
export { exchangeHandoffCode };

export interface ServerSDKOptions extends ServerSDKConfig {
  /**
   * The bearer token to use for authentication.
   * Read this from your framework's cookie store using the TOKEN_STORAGE_KEY cookie name.
   */
  token: string | null;
}

/**
 * Create a Path SDK instance for server-side use in any framework.
 * You are responsible for reading the token from your framework's cookie store.
 *
 * @example
 * ```ts
 * // Nuxt server route (server/api/progress.get.ts)
 * import { pathServerSDK, TOKEN_STORAGE_KEY } from '@vch-lt/path/server';
 *
 * export default defineEventHandler(async (event) => {
 *   const token = getCookie(event, TOKEN_STORAGE_KEY) ?? null;
 *   const path = pathServerSDK({ courseId: 'your-course-id', token });
 *   return path.getEnrollmentAndProgress();
 * });
 * ```
 *
 * @example
 * ```ts
 * // Express
 * import { pathServerSDK, TOKEN_STORAGE_KEY } from '@vch-lt/path/server';
 *
 * app.get('/progress', async (req, res) => {
 *   const token = req.cookies[TOKEN_STORAGE_KEY] ?? null;
 *   const path = pathServerSDK({ courseId: 'your-course-id', token });
 *   res.json(await path.getEnrollmentAndProgress());
 * });
 * ```
 */
export function pathServerSDK(options: ServerSDKOptions): ServerSDKInstance {
  const { token, ...config } = options;
  return createServerSDK(config, token);
}
