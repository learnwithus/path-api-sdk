import { TOKEN_STORAGE_KEY } from './fetch-helper.js';
import { createServerSDK } from './server-core.js';
import type { ServerSDKConfig, ServerSDKInstance } from './server-core.js';

export type { ServerSDKInstance };
export type { Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from './types.js';
export type { ServerSDKConfig } from './server-core.js';

/**
 * Create a Path SDK instance for use in Next.js Server Components and server-side code.
 * Automatically reads the bearer token from the Next.js cookie store — no token passing required.
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
  // Dynamic import so the module doesn't crash outside Next.js environments
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_STORAGE_KEY)?.value ?? null;
  return createServerSDK(config, token);
}
