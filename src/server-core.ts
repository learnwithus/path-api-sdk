import type { Enrollment, AuthStatus, Progress, MilestoneValue, SubmitProgressPayload } from "./types.js";
import { toSubmitBody } from "./submit-payload.js";

export interface ServerSDKConfig {
  /**
   * Course ID for the learner.
   * Can be omitted if PATH_COURSE_ID is set in the environment.
   */
  courseId?: string;
  pathUrl?: string;
  /**
   * Your course website URL, used as the default callback after login.
   */
  courseUrl?: string;
}

async function serverFetch<T>(
  url: string,
  token: string | null,
  onTokenRefresh: ((token: string) => void | Promise<void>) | undefined,
  options: { method?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  const refreshedToken = response.headers.get("set-auth-token");
  if (refreshedToken && onTokenRefresh) await onTokenRefresh(refreshedToken);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export function createServerSDK(
  config: ServerSDKConfig,
  token: string | null,
  onTokenRefresh?: (token: string) => void | Promise<void>,
) {
  const pathUrl = config.pathUrl || process.env.PATH_URL || "https://path.vchlearn.ca";
  const courseId = config.courseId || process.env.NEXT_PUBLIC_PATH_COURSE_ID || process.env.PATH_COURSE_ID || "";
  const courseUrl = config.courseUrl || process.env.NEXT_PUBLIC_PATH_COURSE_URL || process.env.COURSE_URL || "";
  if (!courseId) {
    throw new Error("[@vch-lt/path] courseId is required. Pass it in config or set PATH_COURSE_ID in the environment.");
  }

  return {
    /**
     * Build the Path login URL. Pass the result to Next.js `redirect()` (from `next/navigation`)
     * or use it in a `NextResponse.redirect()` in middleware.
     *
     * @param callbackUrl - URL to return to after login. Defaults to `courseUrl` from config.
     *
     * @example
     * ```ts
     * import { redirect } from 'next/navigation';
     *
     * const path = await pathServerSDK({ courseId: 'your-course-id', courseUrl: 'https://your-site.com' });
     * const auth = await path.checkAuth();
     * if (!auth.isAuthenticated) redirect(path.getLoginUrl());
     * ```
     */
    getLoginUrl: (callbackUrl?: string): string => {
      const callback = encodeURIComponent(callbackUrl || courseUrl);
      return `${pathUrl}/learner/login?courseId=${courseId}&callbackUrl=${callback}`;
    },

    /**
     * Check authentication status and return enrollment data if authenticated.
     */
    checkAuth: async (): Promise<AuthStatus> => {
      try {
        const enrollment = await serverFetch<Enrollment>(`${pathUrl}/api/learner?courseId=${courseId}`, token, onTokenRefresh);
        return { isAuthenticated: true, enrollment };
      } catch {
        return { isAuthenticated: false };
      }
    },

    /**
     * Get enrollment and progress data for the current user.
     */
    getEnrollmentAndProgress: async (): Promise<Enrollment> => {
      return serverFetch<Enrollment>(`${pathUrl}/api/learner?courseId=${courseId}`, token, onTokenRefresh);
    },

    /**
     * Submit progress for a milestone. Pass a bare value to mark it complete, or a
     * `{ data, complete }` payload to control completeness independently of the value.
     */
    submitProgress: async (
      milestoneSlug: string,
      valueOrPayload: MilestoneValue | SubmitProgressPayload,
    ): Promise<Progress> => {
      return serverFetch<Progress>(`${pathUrl}/api/learner?courseId=${courseId}`, token, onTokenRefresh, {
        method: "POST",
        body: toSubmitBody(milestoneSlug, valueOrPayload),
      });
    },
  };
}

export type ServerSDKInstance = ReturnType<typeof createServerSDK>;
