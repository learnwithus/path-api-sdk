import { TOKEN_STORAGE_KEY } from "./fetch-helper.js";
import { createServerSDK } from "./server-core.js";
import type { ServerSDKConfig, ServerSDKInstance } from "./server-core.js";

export type { ServerSDKInstance };
export type { Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from "./types.js";
export type { ServerSDKConfig } from "./server-core.js";

// Internal header name used to forward the token from middleware to SSR
const PATH_TOKEN_HEADER = "x-path-token";

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
  return async function pathMiddleware(request: InstanceType<typeof import("next/server").NextRequest>) {
    const { NextResponse } = await import("next/server");
    const token = request.nextUrl.searchParams.get("path-token");
    if (!token) return;

    // Rewrite URL to strip ?path-token= from the browser address bar
    const url = request.nextUrl.clone();
    url.searchParams.delete("path-token");

    // Forward token to SSR via request header (readable via headers() in Server Components)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(PATH_TOKEN_HEADER, token);

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });

    // Set cookie on the response so all subsequent requests include it automatically
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
 * import { pathNextSDK } from '@vch-lt/path/next';
 *
 * export default async function CoursePage() {
 *   const path = await pathNextSDK({ courseId: 'your-course-id' });
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
export async function pathNextSDK(config: ServerSDKConfig): Promise<ServerSDKInstance> {
  const { cookies, headers } = await import("next/headers");
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  // Prefer cookie (set on prior requests); fall back to header (set by middleware on first request)
  const token = cookieStore.get(TOKEN_STORAGE_KEY)?.value ?? headerStore.get(PATH_TOKEN_HEADER) ?? null;

  return createServerSDK(config, token);
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
