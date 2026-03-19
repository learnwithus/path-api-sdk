import { type NextRequest, NextResponse } from "next/server";
import { TOKEN_STORAGE_KEY } from "./constants.js";
import { createServerSDK } from "./server-core.js";
import type { ServerSDKConfig, ServerSDKInstance } from "./server-core.js";

export type { ServerSDKInstance };
export type { Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from "./types.js";
export type { ServerSDKConfig } from "./server-core.js";


/**
 * Next.js middleware that intercepts the ?path-token= query param on redirect from Path login.
 *
 * On the first page load after login the bearer token arrives as ?path-token= in the URL.
 * Without this middleware, the cookie isn't set until client-side JS runs, so the first
 * SSR render would see an unauthenticated request.
 *
 * This middleware handles it in a single request with no redirect:
 * 1. Reads ?path-token= from the URL
 * 2. Sets the bearer token cookie on the response (available for all future requests)
 * 3. Forwards the token to SSR via an internal x-path-token request header
 * 4. Rewrites the URL to remove ?path-token= from the browser address bar
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { createPathMiddleware } from '@vch-lt/path/next';
 * import type { NextRequest } from 'next/server';
 *
 * const handlePath = createPathMiddleware();
 *
 * export function middleware(request: NextRequest) {
 *   return handlePath(request);
 * }
 * ```
 *
 * If you have your own middleware, call it and merge the responses:
 * ```ts
 * export function middleware(request: NextRequest) {
 *   const pathResponse = handlePath(request);
 *   if (pathResponse) return pathResponse;
 *   // ... your own logic
 * }
 * ```
 */
export function createPathMiddleware() {
  return async function pathMiddleware(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("path-token");
    if (!token) return;

    // Redirect to the same URL without ?path-token= so the token doesn't stay in the browser address bar.
    // The cookie is set on the redirect response, so it will be available on the next request.
    const url = request.nextUrl.clone();
    url.searchParams.delete("path-token");

    const response = NextResponse.redirect(url);

    response.cookies.set(TOKEN_STORAGE_KEY, token, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  };
}

/**
 * Create a Path SDK instance for use in Next.js Server Components and server-side code.
 * Automatically reads the bearer token from the cookie store or the x-path-token header
 * (set by createPathMiddleware on the first request after login).
 *
 * Must be called in an async Server Component, Route Handler, or Server Action.
 *
 * @example
 * ```tsx
 * // app/page.tsx (Server Component)
 * import { pathServerSDK } from '@vch-lt/path/next';
 *
 * export default async function CoursePage() {
 *   const path = await pathServerSDK({ courseId: 'your-course-id' });
 *   const auth = await path.checkAuth();
 *
 *   if (!auth.isAuthenticated) {
 *     redirect('/login');
 *   }
 *
 *   return <div>Welcome, {auth.enrollment?.user.email}</div>;
 * }
 * ```
 */
export async function pathServerSDK(config: ServerSDKConfig) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  const token = cookieStore.get(TOKEN_STORAGE_KEY)?.value ?? null;

  const sdk = createServerSDK(config, token, (newToken) => {
    // cookies() returns ReadonlyRequestCookies in types but supports .set() in Route Handlers/Server Actions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cookieStore as any).set(TOKEN_STORAGE_KEY, newToken, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });

  return {
    ...sdk,
    /**
     * Redirect to the Path login page. Call this in a Server Component, Route Handler,
     * or Server Action — it uses Next.js `redirect()` internally.
     *
     * @param callbackUrl - URL to return to after login. Defaults to `courseUrl` from config.
     *
     * @example
     * ```ts
     * const path = await pathServerSDK({ courseId: 'your-course-id', courseUrl: 'https://your-site.com' });
     * const auth = await path.checkAuth();
     * if (!auth.isAuthenticated) await path.login();
     * ```
     */
    login: async (callbackUrl?: string): Promise<never> => {
      const { redirect } = await import("next/navigation");
      return redirect(sdk.getLoginUrl(callbackUrl));
    },
  };
}

/**
 * Pre-built Next.js middleware instance. Re-export from your middleware.ts:
 *
 * ```ts
 * // middleware.ts
 * export { pathMiddleware as default, pathMiddlewareConfig as config } from '@vch-lt/path/next';
 * ```
 */
export const pathMiddleware = createPathMiddleware();

/**
 * Default middleware matcher config — excludes Next.js internals and static files.
 * Re-export as `config` from your middleware.ts alongside `pathMiddleware`.
 */
export const pathMiddlewareConfig = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
