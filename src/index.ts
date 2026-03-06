import type { LearnerAPIConfig, Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from "./types.js";
import { apiRequest, setToken, getToken } from "./fetch-helper.js";

export * from "./types.js";
export { apiRequest, setToken, getToken, TOKEN_STORAGE_KEY } from "./fetch-helper.js";

/**
 * Factory function to create a Path SDK instance
 *
 * @example
 * ```typescript
 * export const path = pathSDK({ courseId: "your-course-id-here", courseUrl: "https://your-course-website.com" });
 *
 * // Use the SDK
 * const auth = await path.checkAuth();
 * await path.submitProgress('module-1-complete', true);
 * ```
 */
export function pathSDK(config: LearnerAPIConfig) {
  // Read ?path-token= from the URL on first SDK instantiation (login redirect)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("path-token");
    if (urlToken) {
      setToken(urlToken);
      params.delete("path-token");
      const search = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState(null, "", window.location.pathname + search + window.location.hash);
    }
  }

  const env = typeof process !== "undefined" ? process.env : ({} as NodeJS.ProcessEnv);
  // import.meta.env is Vite's way of exposing VITE_-prefixed env vars to the browser
  const meta = typeof import.meta !== "undefined" ? ((import.meta as { env?: Record<string, string> }).env ?? {}) : {};
  const pathUrl = config.pathUrl ?? meta.VITE_PATH_URL ?? env.PATH_URL ?? "https://path.vchlearn.ca";
  const courseUrl = config.courseUrl;
  const courseId =
    config.courseId || meta.VITE_PATH_COURSE_ID || env.NEXT_PUBLIC_PATH_COURSE_ID || env.PATH_COURSE_ID || "";
  if (!courseId) {
    throw new Error("[@vch-lt/path] courseId is required. Pass it in config or set PATH_COURSE_ID in the environment.");
  }

  return {
    /**
     * Check authentication status
     */
    checkAuth: async (): Promise<AuthStatus> => {
      try {
        const enrollment = await apiRequest<Enrollment>(`${pathUrl}/api/learner?courseId=${courseId}`);
        return {
          isAuthenticated: true,
          enrollment,
        };
      } catch (error) {
        return {
          isAuthenticated: false,
        };
      }
    },

    /**
     * Redirect to login page
     */
    login: (callbackUrl?: string): void => {
      const callback = encodeURIComponent(callbackUrl || courseUrl);
      window.location.href = `${pathUrl}/learner/login?courseId=${courseId}&callbackUrl=${callback}`;
    },

    /**
     * Logout the current user and clear the stored token
     */
    logout: async (): Promise<void> => {
      await apiRequest(`${pathUrl}/api/learner/logout?courseId=${courseId}`, { method: "POST" });
      setToken(null);
    },

    /**
     * Get enrollment and progress data
     */
    getEnrollmentAndProgress: async (): Promise<Enrollment> => {
      return await apiRequest<Enrollment>(`${pathUrl}/api/learner?courseId=${courseId}`);
    },

    /**
     * Submit progress for a milestone
     */
    submitProgress: async (milestoneSlug: string, value: MilestoneValue): Promise<SubmitProgressResponse> => {
      return await apiRequest<SubmitProgressResponse>(`${pathUrl}/api/learner?courseId=${courseId}`, {
        method: "POST",
        body: {
          milestoneSlug,
          value,
        },
      });
    },
  };
}

/**
 * Type for the return value of pathSDK
 */
export type PathSDKInstance = ReturnType<typeof pathSDK>;

/**
 * Default export for convenience
 */
export default pathSDK;
